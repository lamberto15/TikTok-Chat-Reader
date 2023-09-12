require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const { object, string, array, ValidationError } = require('yup');
const { validate } = require('./middlewares');
const { gameSchema } = require('./schema');
const { PrismaClientKnownRequestError } = require('@prisma/client/runtime/library');
const app = express();
const httpServer = createServer(app);

const prisma = new PrismaClient();

app.use(express.json())
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    },
    path: "/admin"
});

// Socket.IO connection event
io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.id}`);

    await emitNewWinners()
    await emitNewPlayers()
    await emitNewOngoingPlayers()

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const emitNewWinners = async () => {
    try {
        const playersData = await getWinners();
        io.emit('winners', playersData);
    } catch (error) {
        console.error(error);
    }
}

const emitNewOngoingPlayers = async () => {
    try {
        const playersData = await getOngoingPlayers();
        io.emit('ongoing players', playersData);
    } catch (error) {
        console.error(error);
    }
}

const emitNewPlayers = async () => {

    try {
        const playersData = await getPlayers();

        // Emit the players' data to the connected client
        io.emit('players', playersData);
    } catch (error) {
        console.error(error);
    }
}


const startListineng = () => {
    let tiktokConnectionWrapper;
    let tryCount = 0
    // Connect to the given username
    try {
        console.log("connecting");
        tiktokConnectionWrapper = new TikTokConnectionWrapper("@stellajero16", {}, false);
        tiktokConnectionWrapper.connect(true);
    } catch (err) {
        console.log("Disconnected");
    }

    // Redirect wrapper control events once
    tiktokConnectionWrapper.once('connected', state => {
        console.log("connected");
    });
    tiktokConnectionWrapper.once('disconnected', reason => {
        console.log("disconnected");
    });

    // Notify client when stream ends
    tiktokConnectionWrapper.connection.on('streamEnd', () => {
        console.log("streamEnd");
    });

    tiktokConnectionWrapper.connection.on('gift', async msg => {
        try {
            await prisma.$transaction(async tx => {
                let gameId = null
                const existingOpenGame = await tx.games.findFirst({
                    where: {
                        status: 'open'
                    },
                    select: {
                        id: true
                    },
                    orderBy: {
                        id: 'asc'
                    }
                })

                gameId = existingOpenGame ? existingOpenGame.id : null

                if (!existingOpenGame) {
                    const newGame = await tx.games.create({
                        data: {
                            status: 'open',
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                        select: {
                            id: true
                        }
                    })
                    gameId = newGame.id
                }

                await tx.tiktok_gifts.create({
                    data: {
                        data: msg,
                        describe: msg.describe,
                        diamondCount: msg.diamondCount,
                        giftId: msg.giftId,
                        giftName: msg.giftName,
                        giftPictureUrl: msg.giftPictureUrl,
                        giftType: msg.giftType,
                        msgId: msg.msgId,
                        nickname: msg.nickname,
                        profilePictureUrl: msg.profilePictureUrl,
                        receiverUserId: msg.receiverUserId,
                        secUid: msg.secUid,
                        timestamp: new Date(msg.timestamp),
                        uniqueId: msg.uniqueId,
                        userId: msg.uniqueId,
                        gameId: gameId
                    }
                })
            })
            emitNewPlayers()
        } catch (error) {
            console.log(error);
        }
    });
}
// startListineng()
app.use(express.static('public'));

app.get(
    '/start-listening',
    async (req, res) => {
        try {
            startListineng()
            return res.json({
                message: "Starting"
            })
        } catch (error) {
            console.log(error);
            return res.json("error")
        }
    })

app.get('/ongoing-players', async (req, res) => {
    try {
        const result = await getOngoingPlayers()
        return res.json(result)
    } catch (error) {
        console.log(error);
        return res.json("error")
    }
})

app.get('/players', async (req, res) => {
    try {
        const result = await getPlayers()
        return res.json(result)
    } catch (error) {
        console.log(error);
        return res.json("error")
    }
})

app.post('/games', validate(gameSchema), async (req, res) => {
    try {
        const { id, winnerId, status } = req.body

        if (status === 'done' && !winnerId) {
            return res.json({
                message: 'winnerId is required'
            })
        }

        await prisma.$transaction(async tx => {


            const updatedGame = await tx.games.update({
                data: {
                    status,
                    updated_at: new Date()
                },
                where: {
                    id
                }
            })

            if (status === 'done') {
                const winner = await tx.tiktok_gifts.findFirstOrThrow({
                    where: {
                        msgId: winnerId
                    }
                })

                await tx.tiktok_gifts.update({
                    data: {
                        isWinner: true
                    },
                    where: {
                        msgId: winnerId,
                        gameId: id
                    }
                })
            }
        })
        await emitNewWinners()
        await emitNewPlayers()
        await emitNewOngoingPlayers()
        res.json({
            message: 'success'
        })
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code == 'P2025') {
            return res.json({ message: 'invalid winner msgId' })
        }

        console.error(error)
        return res.json({
            message: 'an error occured'
        })
    }
})


const port = process.env.PORT || 8081;
httpServer.listen(port);
console.info(`Server running! Please visit http://localhost:${port}`);


async function getOngoingPlayers() {
    const game = await prisma.games.findFirst({
        where: {
            status: 'ongoing'
        },
        orderBy: {
            id: 'asc'
        }
    })
    let players = []
    if (game) {
        players = await prisma.tiktok_gifts.findMany({
            select: {
                msgId: true,
                userId: true,
                nickname: true,
                profilePictureUrl: true,
                giftId: true,
                describe: true,
                giftName: true,
                diamondCount: true,
                timestamp: true
            },
            where: {
                game: {
                    id: game.id
                }
            },
            orderBy: {
                game: {
                    id: 'asc'
                }
            }
        })
    }
    return {
        game,
        players
    }
}
async function getPlayers() {
    const game = await prisma.games.findFirst({
        where: {
            status: 'open'
        },
        orderBy: {
            id: 'asc'
        }
    })
    let players = []
    if (game) {
        players = await prisma.tiktok_gifts.findMany({
            select: {
                msgId: true,
                userId: true,
                nickname: true,
                profilePictureUrl: true,
                giftId: true,
                describe: true,
                giftName: true,
                diamondCount: true,
                timestamp: true
            },
            where: {
                game: {
                    id: game.id
                }
            },
            orderBy: {
                game: {
                    id: 'asc'
                }
            }
        })
    }
    return {
        game,
        players
    }
    // return prisma.$queryRaw`
    //         WITH RankedGifts AS (
    //             SELECT
    //                 "msgId",
    //                 "giftId",
    // 				"userId",
    // 				"nickname",
    // 				"profilePictureUrl",
    //                 "describe",
    //                 "giftName",
    //                 "diamondCount",
    //                 TIMEZONE('Asia/Manila', "timestamp") as "timestamp",
    //                 ROW_NUMBER() OVER (PARTITION BY "uniqueId" ORDER BY "timestamp" ASC) AS row_num
    //             FROM
    //                 public.tiktok_gifts
    //             )
    //         SELECT
    //             "msgId",
    // 			"giftId",
    // 			"userId",
    // 			"nickname",
    // 			"profilePictureUrl",
    // 			"describe",
    // 			"giftName",
    // 			"diamondCount",
    //             "timestamp"
    //         FROM
    //             RankedGifts
    //         WHERE
    //             row_num <= ${maxPlayerBetPerGame}
    //         ORDER BY "timestamp" ASC
    //         LIMIT ${maxPlayerPerGame};
    //     `;
}

function getWinners() {
    return prisma.tiktok_gifts.findMany({
        select: {
            msgId: true,
            userId: true,
            nickname: true,
            profilePictureUrl: true,
            giftId: true,
            describe: true,
            giftName: true,
            diamondCount: true,
            timestamp: true,
            updated_at: true
        },
        where: {
            isWinner: true
        },
        orderBy: {
            id: 'desc'
        },
        take: 100
    })
}
