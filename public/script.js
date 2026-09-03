const socket = io();

const submitBtn = document.getElementById("submit");
const selectionsEl = document.getElementById("selections");
const winnerEl = document.getElementById("winner");
const playerEl = document.getElementById("player");
const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const tiesEl = document.getElementById("ties");

//Send message to the server when the user presses Enter
submitBtn.addEventListener("click", () => {
    // console.log(document.querySelector('input[name="choice"]:checked').value);
    const choice = document.querySelector('input[name="choice"]:checked').value;
    socket.emit("selectChoice", choice);
});

//** Listen for messages from the server**
socket.on("displayPlayer", (player) => {
    playerEl.textContent = player;
});
//shows selected choices and wait for other player
socket.on("choiceSelected", (choices, playerId) => {
    // console.log('choices received', choices, playerId);
    selectionsEl.textContent = `You selected ${choices[playerId]}. Waiting for opponent...`;
});

// Listen for winner announcement
socket.on("winner", (data, currentScore) => {
    submitBtn.disabled = true;
    selectionsEl.textContent = "";
    score1El.textContent = `${currentScore.player1}`;
    score2El.textContent = `${currentScore.player2}`;
    tiesEl.textContent = `${currentScore.ties}`;
    winnerEl.textContent = data;
    let restartBtn = document.createElement("button");
    restartBtn.id = "restart";
    restartBtn.textContent = "Play Again";
    document.body.appendChild(restartBtn);
    restartBtn.addEventListener("click", () => {
        socket.emit("restartGame");
    });
});

// Listen for game restart
socket.on("restartGame", resetGame);

function resetGame() {
    selectionsEl.textContent = "";
    winnerEl.textContent = "";
    const restartBtn = document.getElementById("restart");
    if (restartBtn) {
        restartBtn.remove();
    }
    submitBtn.disabled = false;
}

// Listen for player disconnection
socket.on("playerDisconnected", () => {
    resetGame();
    score1El.textContent = "0";
    score2El.textContent = "0";
    tiesEl.textContent = "0";
    selectionsEl.textContent = "Your opponent has disconnected. Please wait for a new player to join.";
});

// Listen for player join message
socket.on("playerJoinedRoom", (playerCount) => {
    if (playerCount === 1) {
        selectionsEl.textContent = "Please wait for another player to join.";
    }
    else {
        selectionsEl.textContent = "Game started! Please make your selection.";
    }
});
