const socket = io();
let currentGameId = null;
let ongoingGameId = null;
let playerDataList = [];
let ongoingPlayerDataList = [];
let winnerDataList = [];

const WHEEL_RADIUS = 380;
const TEXT_FONT_SIZE = 16;
let wheelPower = 2;
let wheelSpinning = false;

const playerUL = document.getElementById("playerUL");
const winnerUL = document.getElementById("winnerUL");
const btnStartListening = document.getElementById("startListening");
const listOfPlayers = document.getElementById("listOfPlayers");
const lisOfWinners = document.getElementById("lisOfWinners");
const pakWheel = document.getElementById("pakWheel");


const sleep = (time = 1_000) => new Promise(resolve => setTimeout(resolve, time));

class WheelGamePlaceholder {
    constructor(players) {
        const numSegments = players.length ? players.length : 1;
        const segments = players.map((player) => ({
            fillStyle: '#' + Math.floor(Math.random() * 16777215).toString(16),
            text: player.userId,
            id: Math.floor(Math.random() * Date.now())
        }));

        if (!segments.length) {
            for (let i = 0; i < 1; i++) {
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
                    'spins': 10,
                    'callbackFinished': this.alertPrize.bind(this),
                }
            });
        }
    }

    alertPrize(indicatedSegment) {
        console.log("The winner is: " + indicatedSegment.text);
        this.resetWheel();

        fireConfetti();  // Fire the confetti first

        // Delay the toast by 2 seconds after the confetti
        setTimeout(() => {
            showToast("Congratulations " + indicatedSegment.text);
        }, 500);
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

        fireConfetti();  // Fire the confetti first

        // Delay the toast by 2 seconds after the confetti
        setTimeout(() => {
            showToast("Congratulations " + indicatedSegment.text);
        }, 500);
    }

    async startSpin() {
        console.log(this.players)
        const numSegments = this.players.length;

        const segments = this.players.map((player) => ({
            fillStyle: '#' + Math.floor(Math.random() * 16777215).toString(16),
            text: player.userId,
            id: player.msgId
        }));
        console.log(this.players)
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
                'spins': 10,
                'callbackFinished': await this.alertPrize.bind(this),
            }
        });
        listOfPlayers.innerHTML = 'List of Players' + ' ' + '('+ this.players.length + ')';
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
    winnerUL.innerHTML = "";

    data.forEach((item) => {
        const li = document.createElement("li");
        li.className = "winnerRow";
        const payout = document.createElement("p");
        const idUser = document.createElement("p");
        payout.textContent =  item.payoutStatus ? "Paid":"Unpaid";
        idUser.textContent = item.userId
        li.appendChild(idUser);
        li.appendChild(payout);
        winnerUL.appendChild(li);
    });

    newItems.forEach((item) => {
        winnerDataList.push(item.userId);
    });

    lisOfWinners.innerHTML = 'List of Winners' + ' ' + '(' +  winnerDataList.length + ')';
});

socket.on("ongoing players", (data) => {
    ongoingGameId = data.game ? data.game.id : null;
    ongoingPlayerDataList = data.players;

    ongoingPlayerDataList.forEach((item) => {
        pakWheel.innerHTML = 'Pak Wheel:' + ' ' + '(' + ongoingPlayerDataList.length + ')';
    });
    
});

socket.on("players", (data) => {
    const { game, players } = data;
    if (game && game.id != currentGameId) {

        playerUL.innerHTML="";
    }
    currentGameId = game ? game.id : null;
    const newItems = players.filter(
        (item) =>
            !playerDataList.find((_player) => _player.msgId === item.msgId)
    );
    
    newItems.forEach((item) => {
        playerDataList.push(item);
        const li = document.createElement("li");
        li.textContent = item.userId;
        playerUL.appendChild(li);
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

const startListen = async () => {
    try {
        await axios.get("/start-listening");
    } catch (error) {
        console.log(error);
    }
}

btnStartListening.addEventListener("click", startListen);

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


function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => closeToast(toast), 3000);
}

function closeToast(toastElement) {
    toastElement.remove();
}

function fireConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

let isWheelResting = false
setInterval(async () => {
    if (!isWheelResting) {
        if (ongoingPlayerDataList.length > 0 && ongoingGameId || currentGameId) {
            if (!ongoingGameId) {
                await toggleGameOngoing()
                await sleep()
            }
            console.log("ongoingPlayerDataList", ongoingPlayerDataList)
            const wheel = new WheelGame(ongoingGameId, ongoingPlayerDataList)
            await wheel.startSpin()
            currentGameId = null
            ongoingPlayerDataList = []
        }
        isWheelResting = true
    } else {
        isWheelResting = false
    }
}, 6_000)