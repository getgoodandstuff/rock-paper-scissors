const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

const rooms = new Map();
let nextRoomId = 1;

io.on('connection', socket => {
    //if there is a room with only one player, join that room, otherwise create a new room
    let room = [...rooms.values()].find(room => room.players.length === 1);
    if (!room) {
        room = {
            id: `room-${nextRoomId++}`,
            players: [],
            choices: {},
            score: { player1: 0, player2: 0, ties: 0 }
        };
        rooms.set(room.id, room);
    }

    // adds the player to the room and notifies them of their player number
    room.players.push(socket.id);
    socket.join(room.id);
    socket.data.roomId = room.id;
    io.to(room.id).emit('playerJoinedRoom', room.players.length);

    io.to(socket.id).emit('displayPlayer', 'You are Player ' + room.players.length);
    console.log('a user connected', socket.id);
    socket.on('selectChoice', (choice) => {
        const room = rooms.get(socket.data.roomId);
        if (!room || room.players.length !== 2) {
            return;
        }

        room.choices[socket.id] = choice;
        // Check if both players have made their choices then send winner
        if (Object.keys(room.choices).length === 2) {
            const [player1, player2] = room.players;
            const choice1 = room.choices[player1];
            const choice2 = room.choices[player2];
            if ((choice1 === 'rock' && choice2 === 'scissors') ||
                (choice1 === 'paper' && choice2 === 'rock') ||
                (choice1 === 'scissors' && choice2 === 'paper')) {
                room.score.player1++;
                io.to(player1).emit('winner', `Winner!`, room.score);
                io.to(player2).emit('winner', `Loser!`, room.score);
            } else if ((choice2 === 'rock' && choice1 === 'scissors') ||
                (choice2 === 'paper' && choice1 === 'rock') ||
                (choice2 === 'scissors' && choice1 === 'paper')) {
                room.score.player2++;
                io.to(player1).emit('winner', `Loser!`, room.score);
                io.to(player2).emit('winner', `Winner!`, room.score);
            } else {
                room.score.ties++;
                io.to(room.id).emit('winner', "Tie!", room.score);
            }
        } else {
            io.to(socket.id).emit('choiceSelected', room.choices, socket.id);
        }
    });

    socket.on('restartGame', () => {
        const room = rooms.get(socket.data.roomId);
        if (!room) {
            return;
        }

        room.choices = {};
        io.to(room.id).emit('restartGame');
    });

    socket.on('disconnect', () => {
        // console.log('user disconnected', socket.id);
        const room = rooms.get(socket.data.roomId);
        if (!room) {
            return;
        }

        if (room.players.length === 0) {
            rooms.delete(room.id);
            return;
        }

        // Clean up the room and notify the remaining player
        room.choices = {};
        room.score = { player1: 0, player2: 0, ties: 0 };
        room.players = room.players.filter(player => player !== socket.id);
        const remainingPlayerId = room.players[0];
        io.to(room.id).emit('playerDisconnected');
        io.to(remainingPlayerId).emit('displayPlayer', 'You are Player 1');

        //Look for another room with only one player and move the remaining player there
        let newRoom = [...rooms.values()].find(r => r.players.length === 1 && r.id !== room.id);
        if (newRoom) {
            const remainingSocket = io.sockets.sockets.get(remainingPlayerId);

            if (!remainingSocket) {
                return;
            }
            //moves the remaining player to the new room and notifies them of their player number
            remainingSocket.leave(room.id);
            remainingSocket.join(newRoom.id);
            remainingSocket.data.roomId = newRoom.id;
            newRoom.players.push(remainingPlayerId);
            remainingSocket.emit('displayPlayer', 'You are Player 2');
            io.to(newRoom.id).emit('playerJoinedRoom', newRoom.players.length);

            rooms.delete(room.id);
            return;
        }

    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);

//http://localhost:3000