// public/client.js
const board = document.getElementById('board');
const currentTurn = document.getElementById('current-turn');
const log = document.getElementById('log');
const createRoomButton = document.getElementById('create-room');
const joinRoomButton = document.getElementById('join-room');
const roomCodeInput = document.getElementById('room-code');

let ws;
let roomCode;
let currentPlayer;

createRoomButton.addEventListener('click', () => {
    ws = new WebSocket(`ws://${window.location.host}`);
    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'create_room' }));
    };
    ws.onmessage = handleServerMessage;
});

joinRoomButton.addEventListener('click', () => {
    roomCode = roomCodeInput.value;
    ws = new WebSocket(`ws://${window.location.host}`);
    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join_room', roomCode }));
    };
    ws.onmessage = handleServerMessage;
});

function handleServerMessage(event) {
    const message = JSON.parse(event.data);
    switch (message.type) {
        case 'room_created':
            roomCode = message.roomCode;
            log.textContent = `Room created! Room Code: ${roomCode}`;
            break;
        case 'room_joined':
            log.textContent = `Joined room: ${roomCode}`;
            break;
        case 'state_update':
            currentPlayer = message.currentPlayer;
            updateBoard(message.gameState);
            currentTurn.textContent = `Turn: Player ${currentPlayer}`;
            break;
        case 'invalid_move':
            alert(`Invalid move: ${message.reason}`);
            break;
        case 'game_over':
            alert(`Game over! Winner: Player ${message.winner}`);
            break;
    }
}

function updateBoard(gameState) {
    board.innerHTML = '';
    gameState.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const div = document.createElement('div');
            div.className = 'cell';
            div.textContent = cell ? cell : '';
            div.addEventListener('click', () => handleCellClick(rowIndex, colIndex));
            board.appendChild(div);
        });
    });
}

function handleCellClick(rowIndex, colIndex) {
    const character = prompt('Enter your character and move (e.g., P1:L, H1:FR)');
    if (character) {
        ws.send(JSON.stringify({ type: 'player_move', roomCode, move: { character, direction: character.split(':')[1] } }));
    }
}
