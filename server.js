const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

let players = [];
let choices = {};
let score = { player1: 0, player2: 0, ties: 0 };

io.on('connection', socket => {
    players.push(socket.id);
    io.to(socket.id).emit('displayPlayer', 'You are Player ' + players.length);
    // console.log('a user connected', socket.id);
    socket.on('selectChoice', (choice) => {
        choices[socket.id] = choice;
        // Check if both players have made their choices then send winner
        if (Object.keys(choices).length === 2) {
            const [player1, player2] = players;
            const choice1 = choices[player1];
            const choice2 = choices[player2];
            if ((choice1 === 'rock' && choice2 === 'scissors') ||
                (choice1 === 'paper' && choice2 === 'rock') ||
                (choice1 === 'scissors' && choice2 === 'paper')) {
                score.player1++;
                io.to(player1).emit('winner', `Winner!`, score);
                io.to(player2).emit('winner', `Loser!`, score);
            } else if ((choice2 === 'rock' && choice1 === 'scissors') ||
                (choice2 === 'paper' && choice1 === 'rock') ||
                (choice2 === 'scissors' && choice1 === 'paper')) {
                score.player2++;
                io.to(player1).emit('winner', `Loser!`, score);
                io.to(player2).emit('winner', `Winner!`, score);
            } else {
                score.ties++;
                io.emit('winner', "Tie!", score);
            }
        } else {
            io.to(socket.id).emit('choiceSelected', choices, socket.id);
        }
    });

    socket.on('restartGame', () => {
        choices = {};
        io.emit('restartGame');
    });

    socket.on('disconnect', () => {
        // console.log('user disconnected', socket.id);
        players = players.filter(player => player !== socket.id);
        delete choices[socket.id];
        io.emit('restartGame'); // Reset game if a player disconnects
        io.emit('displayPlayer', `You are Player ${players.length}`); // Update player number
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);

//http://localhost:3000