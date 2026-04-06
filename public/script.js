const socket = io();

const submitBtn = document.getElementById("submit");
const selectionsEl = document.getElementById("selections");
const winnerEl = document.getElementById("winner");
const playerEl = document.getElementById("player");

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
    document.getElementById("score1").textContent = `${currentScore.player1}`;
    document.getElementById("score2").textContent = `${currentScore.player2}`;
    document.getElementById("ties").textContent = `${currentScore.ties}`;
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
socket.on("restartGame", () => {
    selectionsEl.textContent = "";
    winnerEl.textContent = "";
    const restartBtn = document.getElementById("restart");
    if (restartBtn) {
        restartBtn.remove();
    }
    submitBtn.disabled = false;
});

