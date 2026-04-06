const socket = io("http://localhost:3000");

const submitBtn = document.getElementById("submit");
const selectionsEl = document.getElementById("selections");
const winnerEl = document.getElementById("winner");

//Send message to the server when the user presses Enter
submitBtn.addEventListener("click", () => {
    console.log(document.querySelector('input[name="choice"]:checked').value);
    const choice = document.querySelector('input[name="choice"]:checked').value;
    socket.emit("selectChoice", choice);
});

//** Listen for messages from the server**
//share winner and selections
socket.on("choiceSelected", (choices, players) => {
    console.log('choices received', choices, players);
    selectionsEl.textContent = `Selections: ${JSON.stringify(choices[players[0]])} by ${players[0]}, ${JSON.stringify(choices[players[1]])} by ${players[1]}`;
});

socket.on("winner", (data) => {
    winnerEl.textContent = `Winner: ${data}`;
});