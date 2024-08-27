// server.js
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Setup Express server to serve the client files
const app = express();
app.use(express.static('public'));

// Create HTTP server and bind WebSocket server to it
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {}; // Store the state of each game room

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const event = JSON.parse(message);
        handleEvent(event, ws);
    });
});

function handleEvent(event, ws) {
    switch (event.type) {
        case 'create_room':
            createRoom(ws);
            break;
        case 'join_room':
            joinRoom(event.roomCode, ws);
            break;
        case 'player_move':
            processMove(event.roomCode, event.move, ws);
            break;
        // Handle other events...
    }
}

function createRoom(ws) {
    const roomCode = uuidv4().slice(0, 6); // Generate a short room code
    rooms[roomCode] = {
        players: [ws],
        gameState: initializeGameState(),
        currentPlayer: 'A',
    };
    ws.send(JSON.stringify({ type: 'room_created', roomCode }));
    ws.send(JSON.stringify({ type: 'state_update', gameState: rooms[roomCode].gameState, currentPlayer: 'A' }));
}

function joinRoom(roomCode, ws) {
    const room = rooms[roomCode];
    if (room && room.players.length < 2) {
        room.players.push(ws);
        ws.send(JSON.stringify({ type: 'room_joined', roomCode }));
        broadcastGameState(roomCode);
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Room full or not found' }));
    }
}

function processMove(roomCode, move, ws) {
    const room = rooms[roomCode];
    if (!room) return;

    const { character, direction } = move;
    const isValid = validateMove(room.gameState, character, direction);

    if (isValid) {
        updateGameState(room.gameState, character, direction);
        room.currentPlayer = room.currentPlayer === 'A' ? 'B' : 'A';
        broadcastGameState(roomCode);
        checkGameOver(roomCode);
    } else {
        ws.send(JSON.stringify({ type: 'invalid_move', reason: 'Invalid move' }));
    }
}

function broadcastGameState(roomCode) {
    const room = rooms[roomCode];
    const stateUpdate = JSON.stringify({ type: 'state_update', gameState: room.gameState, currentPlayer: room.currentPlayer });
    room.players.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(stateUpdate);
        }
    });
}

function checkGameOver(roomCode) {
    const room = rooms[roomCode];
    const aAlive = room.gameState.flat().some(cell => cell && cell.startsWith('A'));
    const bAlive = room.gameState.flat().some(cell => cell && cell.startsWith('B'));

    if (!aAlive || !bAlive) {
        const winner = aAlive ? 'A' : 'B';
        broadcastGameOver(roomCode, winner);
        delete rooms[roomCode];
    }
}

function broadcastGameOver(roomCode, winner) {
    const room = rooms[roomCode];
    room.players.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'game_over', winner }));
        }
    });
}

function initializeGameState() {
    return [
        ['A-P1', 'A-H1', 'A-H2', null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, 'B-H2', 'B-H1', 'B-P1'],
    ];
}

function findCharacterPosition(gameState, character) {
    for (let row = 0; row < gameState.length; row++) {
        for (let col = 0; col < gameState[row].length; col++) {
            if (gameState[row][col] === character) {
                return [row, col];
            }
        }
    }
    return null;
}

function validateMove(gameState, character, direction) {
    const position = findCharacterPosition(gameState, character);
    if (!position) return false;

    const [row, col] = position;
    let newRow = row, newCol = col;
    const moveDistance = character.includes('P') ? 1 : 2;

    switch (direction) {
        case 'L': newCol -= moveDistance; break;
        case 'R': newCol += moveDistance; break;
        case 'F': newRow += (character.startsWith('A') ? -moveDistance : moveDistance); break;
        case 'B': newRow += (character.startsWith('A') ? moveDistance : -moveDistance); break;
        case 'FL': newRow += (character.startsWith('A') ? -moveDistance : moveDistance); newCol -= moveDistance; break;
        case 'FR': newRow += (character.startsWith('A') ? -moveDistance : moveDistance); newCol += moveDistance; break;
        case 'BL': newRow += (character.startsWith('A') ? moveDistance : -moveDistance); newCol -= moveDistance; break;
        case 'BR': newRow += (character.startsWith('A') ? moveDistance : -moveDistance); newCol += moveDistance; break;
        default: return false;
    }

    if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) return false;
    if (gameState[newRow][newCol] && gameState[newRow][newCol].startsWith(character[0])) return false;

    return true;
}

function updateGameState(gameState, character, direction) {
    const position = findCharacterPosition(gameState, character);
    const [row, col] = position;

    let newRow = row, newCol = col;
    const moveDistance = character.includes('P') ? 1 : 2;

    switch (direction) {
        case 'L': newCol -= moveDistance; break;
        case 'R': newCol += moveDistance; break;
        case 'F': newRow += (character.startsWith('A') ? -moveDistance : moveDistance); break;
        case 'B': newRow += (character.startsWith('A') ? moveDistance : -moveDistance); break;
        case 'FL': newRow += (character.startsWith('A') ? -moveDistance : moveDistance); newCol -= moveDistance; break;
        case 'FR': newRow += (character.startsWith('A') ? -moveDistance : moveDistance); newCol += moveDistance; break;
        case 'BL': newRow += (character.startsWith('A') ? moveDistance : -moveDistance); newCol -= moveDistance; break;
        case 'BR': newRow += (character.startsWith('A') ? moveDistance : -moveDistance); newCol += moveDistance; break;
    }

    for (let i = 1; i <= moveDistance; i++) {
        const pathRow = row + ((newRow - row) / moveDistance) * i;
        const pathCol = col + ((newCol - col) / moveDistance) * i;

        if (gameState[pathRow][pathCol] && gameState[pathRow][pathCol].startsWith(character[0])) return false;
        if (i === moveDistance && gameState[pathRow][pathCol]) gameState[pathRow][pathCol] = null;
    }

    gameState[row][col] = null;
    gameState[newRow][newCol] = character;
}

server.listen(8080, () => {
    console.log('Server is listening on port 8080');
});
