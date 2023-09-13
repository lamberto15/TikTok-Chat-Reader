const socket = io();
let currentGameId = null;
let ongoingGameId = null;
let playerDataList = [];
let ongoingPlayerDataList = [];
let winnerDataList = [];

const WHEEL_RADIUS = 400;
const TEXT_FONT_SIZE = 30;
let wheelPower = 2;
let wheelSpinning = false;

const sleep = (time = 1_000) => new Promise(resolve => setTimeout(resolve, time));

class WheelGamePlaceholder {
    constructor(players) {
        const numSegments = players.length ? players.length : 3;
        const segments = players.map((player) => ({
            fillStyle: '#' + Math.floor(Math.random() * 16777215).toString(16),
            text: player.userId,
            id: Math.floor(Math.random() * Date.now())
        }));

        if (!segments.length) {
            for (let i = 0; i < 3; i++) {
                segments.push({
                    fillStyle: '#' + Math.floor(Math.random() * 16777215).toString(16),
                    text: `user_${i + 1}`,
                    id: Math.floor(Math.random() * Date.now())
                })

            }
        }
        // Shuffle the segments randomly
        segments.sort(() => Math.random() - 0.5);

        if (!ongoingGameId) {
            this.theWheel = new Winwheel({
                'numSegments': numSegments,
                'outerRadius': WHEEL_RADIUS,
                'textFontSize': TEXT_FONT_SIZE,
                'segments': segments,
                'animation':
                {
                    'type': 'spinToStop',
                    'duration': 3,
                    'spins': 8,
                    'callbackFinished': this.alertPrize.bind(this),
                }
            });
        }
    }

    alertPrize(indicatedSegment) {
        console.log("The winner is: " + indicatedSegment.text);
        this.resetWheel();
    }
}

class WheelGame {
    constructor(gameId, players) {
        this.gameId = gameId
        this.players = players
    }

    async alertPrize(indicatedSegment) {
        console.log("The winner is: " + indicatedSegment.text);
        await toggleGameDone(this.gameId, indicatedSegment.id)
        this.resetWheel();

    }

    async startSpin() {
        console.log(this.players)
        const numSegments = this.players.length;

        const segments = this.players.map((player) => ({
            fillStyle: '#' + Math.floor(Math.random() * 16777215).toString(16),
            text: player.userId,
            id: player.msgId
        }));

        // Shuffle the segments randomly
        segments.sort(() => Math.random() - 0.5);

        this.theWheel = new Winwheel({
            'canvasId': 'canvas',
            'numSegments': numSegments,
            'outerRadius': WHEEL_RADIUS,
            'textFontSize': TEXT_FONT_SIZE,
            'segments': segments,
            'animation':
            {
                'type': 'spinToStop',
                'duration': 3,
                'spins': 8,
                'callbackFinished': await this.alertPrize.bind(this),
            }
        });
        this.theWheel.startAnimation();
    }

    resetWheel() {
        if (this.theWheel) {
            this.theWheel.stopAnimation(false);
            this.theWheel.rotationAngle = 0;
            this.theWheel.draw();
        }
    }
}

socket.on("winners", (data) => {
    const newItems = data.filter(
        (item) => !winnerDataList.includes(item.userId)
    );

    newItems.forEach((item) => {
        winnerDataList.push(item.userId);
    });
});

socket.on("ongoing players", (data) => {
    ongoingGameId = data.game ? data.game.id : null;
    ongoingPlayerDataList = data.players;

    ongoingPlayerDataList.forEach((item) => {
    });
});

socket.on("players", (data) => {
    const { game, players } = data;

    currentGameId = game ? game.id : null;
    const newItems = players.filter(
        (item) =>
            !playerDataList.find((_player) => _player.msgId === item.msgId)
    );

    newItems.forEach((item) => {
        playerDataList.push(item);
    });
    new WheelGamePlaceholder(players)
});

const toggleGameOngoing = async () => {
    try {
        await axios.post("/games", {
            id: currentGameId,
            status: "ongoing",
        });
    } catch (error) {
        console.log(error);
    }
}

const toggleGameDone = async (gameId, winnerId) => {
    try {
        await axios.post("/games", {
            id: gameId,
            winnerId: winnerId,
            status: "done",
        });

        ongoingGameId = null;
        ongoingPlayerDataList = [];
    } catch (error) {
        console.log(error);
    }
}

let isWheelResting = false
setInterval(async () => {
    if (!isWheelResting) {
        if (currentGameId) {
            await toggleGameOngoing()
            await sleep()

            const wheel = new WheelGame(ongoingGameId, ongoingPlayerDataList)
            await wheel.startSpin()
            currentGameId = null
            ongoingPlayerDataList = []
        }
        isWheelResting = true
    } else {
        isWheelResting = false
    }


}, 20_000)