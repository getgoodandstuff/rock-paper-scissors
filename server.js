const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

let players = [];
let choices = {};

io.on('connection', socket => {
    players.push(socket.id);
    console.log('a user connected', socket.id);
    socket.on('selectChoice', (choice) => {
        choices[socket.id] = choice;
        console.log('choices', choices);
        io.emit('choiceSelected', choices, players);
        // Check if both players have made their choices
        // then send winner
        if (Object.keys(choices).length === 2) {
            const [player1, player2] = players;
            const choice1 = choices[player1];
            const choice2 = choices[player2];
            let winner = 'It\'s a tie!';
            if ((choice1 === 'rock' && choice2 === 'scissors') ||
                (choice1 === 'paper' && choice2 === 'rock') ||
                (choice1 === 'scissors' && choice2 === 'paper')) {
                winner = `Player 1 wins with ${choice1}!`;
            } else if ((choice2 === 'rock' && choice1 === 'scissors') ||
                (choice2 === 'paper' && choice1 === 'rock') ||
                (choice2 === 'scissors' && choice1 === 'paper')) {
                winner = `Player 2 wins with ${choice2}!`;
            }
            io.emit('winner', winner);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
        players = players.filter(player => player !== socket.id);
        delete choices[socket.id];

    });
});

server.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});