require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

// Socket.IO connection event
io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.id}`);


    await emitPushNewPlayers(3, 100)
    // Handle socket disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
const emitPushNewPlayers = async (maxPlayerBetPerGame, maxPlayerPerGame) => {

    try {
        const playersData = await getPlayers(maxPlayerBetPerGame, maxPlayerPerGame);

        // Emit the players' data to the connected client
        io.emit('players', playersData);
    } catch (error) {
        console.error(error);
    }
}
const prisma = new PrismaClient();

const startListineng = () => {
    let tiktokConnectionWrapper;
    let tryCount = 0
    // Connect to the given username
    try {
        console.log("connecting");
        tiktokConnectionWrapper = new TikTokConnectionWrapper("@nature_in_megapolis", {}, false);
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
        await prisma.tiktok_gifts.create({
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
            }
        })
        emitPushNewPlayers(3, 100)
    });
}
// startListineng()
app.use(express.static('public'));
app.get('/start-listening', async (req, res) => {
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
app.get('/players', async (req, res) => {
    try {
        const _maxPlayerBetPerGame = parseInt(req.query.maxPlayerBetPerGame)
        const _maxPlayerPerGame = parseInt(req.query.maxPlayerPerGame)

        const maxPlayerBetPerGame = _maxPlayerBetPerGame > 0 ? _maxPlayerBetPerGame : 3
        const maxPlayerPerGame = _maxPlayerPerGame > 0 ? _maxPlayerPerGame : 100

        const result = await getPlayers(maxPlayerBetPerGame, maxPlayerPerGame)
        return res.json(result)
    } catch (error) {
        console.log(error);
        return res.json("error")
    }
})



const port = process.env.PORT || 8081;
httpServer.listen(port);
console.info(`Server running! Please visit http://localhost:${port}`);




async function getPlayers(maxPlayerBetPerGame, maxPlayerPerGame) {
    return prisma.$queryRaw`
            WITH RankedGifts AS (
                SELECT
                    "msgId",
                    "giftId",
					"userId",
					"nickname",
					"profilePictureUrl",
                    "describe",
                    "giftName",
                    "diamondCount",
                    TIMEZONE('Asia/Manila', "timestamp") as "timestamp",
                    ROW_NUMBER() OVER (PARTITION BY "uniqueId" ORDER BY "timestamp" ASC) AS row_num
                FROM
                    public.tiktok_gifts
                )
            SELECT
                "msgId",
				"giftId",
				"userId",
				"nickname",
				"profilePictureUrl",
				"describe",
				"giftName",
				"diamondCount",
                "timestamp"
            FROM
                RankedGifts
            WHERE
                row_num <= ${maxPlayerBetPerGame}
            ORDER BY "timestamp" ASC
            LIMIT ${maxPlayerPerGame};
        `;
}
