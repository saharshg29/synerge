const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const ROUND_DURATION = 20; // 20 seconds per round

const rooms = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // --- Room Management ---
    socket.on('createRoom', ({ playerName }) => {
        let roomCode;
        do {
            roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (rooms[roomCode]);

        rooms[roomCode] = {
            players: {},
            round: 1,
            gameState: 'lobby',
            hostId: socket.id,
            roundTimer: null,
            gameStartTime: null, // To track total game time
        };
        joinRoom(socket, roomCode, playerName, true);
    });

    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms[roomCode];
        if (!room) return socket.emit('error', 'Room not found.');
        if (Object.keys(room.players).length >= 4) return socket.emit('error', 'Room is full.');
        if (room.gameState !== 'lobby') return socket.emit('error', 'Game has already started.');

        joinRoom(socket, roomCode, playerName, false);
    });

    // --- Game Flow ---
    socket.on('startGame', (roomCode) => {
        const room = rooms[roomCode];
        if (!room || room.hostId !== socket.id) return;
        if (Object.keys(room.players).length < 2) return;

        startNewRound(roomCode);
    });

    socket.on('submitNumber', ({ roomCode, number }) => {
        const room = rooms[roomCode];
        if (!room || !room.players[socket.id] || room.players[socket.id].choice !== null) return;
        
        room.players[socket.id].choice = number;
        io.to(roomCode).emit('playerChoiceMade', socket.id);

        const allPlayers = Object.values(room.players);
        const allHaveChosen = allPlayers.every(p => p.choice !== null);

        if (allHaveChosen) {
            clearTimeout(room.roundTimer);
            processRoundResults(roomCode);
        }
    });

    socket.on('requestNewGame', (roomCode) => {
        const room = rooms[roomCode];
        if (!room || room.hostId !== socket.id) return;
        
        room.round = 1;
        startNewRound(roomCode);
    });

    // --- Disconnect Handling ---
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        const roomCode = socket.data?.roomCode;
        if (!roomCode || !rooms[roomCode]) return;

        const room = rooms[roomCode];
        clearTimeout(room.roundTimer);
        delete room.players[socket.id];
        
        if (Object.keys(room.players).length === 0) {
            delete rooms[roomCode];
            console.log(`Room ${roomCode} deleted - no players remaining`);
            return;
        }

        if (room.hostId === socket.id) {
            room.hostId = Object.keys(room.players)[0];
            console.log(`Host reassigned to ${room.hostId} in room ${roomCode}`);
        }
        
        if (room.gameState !== 'lobby') {
            room.gameState = 'lobby';
            room.round = 1;
            Object.values(room.players).forEach(p => p.choice = null);
            io.to(roomCode).emit('gameEndedByDisconnect', 'A player disconnected. Returning to lobby.');
        }

        updateLobby(roomCode);
    });
});

// --- Helper Functions ---
function joinRoom(socket, roomCode, playerName, isHost) {
    const room = rooms[roomCode];
    if (!room) return;

    socket.join(roomCode);
    socket.data = socket.data || {};
    socket.data.roomCode = roomCode;

    room.players[socket.id] = {
        name: playerName || `Player ${Object.keys(room.players).length + 1}`,
        isHost: isHost,
        choice: null,
    };

    console.log(`Player ${playerName} joined room ${roomCode} as ${isHost ? 'host' : 'guest'}`);
    socket.emit('joinSuccess', roomCode);
    updateLobby(roomCode);
}

function updateLobby(roomCode) {
    const room = rooms[roomCode];
    if (room) {
        io.to(roomCode).emit('updateLobby', {
            players: Object.values(room.players),
            hostId: room.hostId,
        });
    }
}

function startNewRound(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;
    
    room.gameState = 'playing';
    Object.values(room.players).forEach(p => p.choice = null);

    if (room.round === 1) {
        room.gameStartTime = Date.now();
    }

    console.log(`Starting round ${room.round} in room ${roomCode}`);
    io.to(roomCode).emit('gameStarted', { round: room.round, duration: ROUND_DURATION });

    room.roundTimer = setTimeout(() => {
        console.log(`Round ${room.round} timed out in room ${roomCode}`);
        processRoundResults(roomCode, true);
    }, ROUND_DURATION * 1000);
}

function processRoundResults(roomCode, timedOut = false) {
    const room = rooms[roomCode];
    if (!room || room.gameState !== 'playing') return;
    
    room.gameState = 'reveal';
    clearTimeout(room.roundTimer);

    const choices = Object.values(room.players).filter(p => p.choice !== null).map(p => p.choice);
    const isSynergy = !timedOut && choices.length > 0 && new Set(choices).size === 1 && choices.length === Object.keys(room.players).length;

    const results = Object.entries(room.players).map(([id, player]) => ({
        id: id,
        name: player.name,
        choice: player.choice === null ? '⌛' : player.choice,
    }));

    console.log(`Round ${room.round} results in room ${roomCode}:`, { results, isSynergy, timedOut });
    io.to(roomCode).emit('roundResult', { results, isSynergy, timedOut });

    setTimeout(() => {
        if (isSynergy) {
            room.gameState = 'finished';
            const score = Math.max(10, 110 - (room.round * 10));
            const totalTime = Date.now() - room.gameStartTime;
            
            console.log(`Synergy achieved in room ${roomCode}! Round: ${room.round}, Score: ${score}, Time: ${totalTime}ms`);
            io.to(roomCode).emit('synergyAchieved', { 
                round: room.round, 
                score, 
                totalTime,
                hostId: room.hostId,
            });
        } else {
            room.round++;
            startNewRound(roomCode);
        }
    }, 5000);
}

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});