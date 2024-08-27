const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = [];
let board = Array(5).fill().map(() => Array(5).fill(null));
let currentPlayerIndex = 0; // 0 for Player A, 1 for Player B
let moveHistory = [];

function initializeBoard() {
    board = [
        ['A-P1', 'A-P2', 'A-H1', 'A-H2', 'A-P3'],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['B-P1', 'B-P2', 'B-H1', 'B-H2', 'B-P3']
    ];
}

function getCurrentPlayer() {
    return currentPlayerIndex === 0 ? 'A' : 'B';
}

function getPosition(char) {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] === char) {
                return [i, j];
            }
        }
    }
    return null;
}

function isValidMove(from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    // Check if move is within the board boundaries
    if (toRow < 0 || toRow >= 5 || toCol < 0 || toCol >= 5) {
        return false;
    }
    // Add other game-specific validation rules here
    return true;
}

function applyMove(char, move) {
    const fromPos = getPosition(char);
    if (!fromPos) return false;

    let [row, col] = fromPos;
    switch (move) {
        case 'F': row -= 1; break; // Move forward
        case 'B': row += 1; break; // Move backward
        case 'L': col -= 1; break; // Move left
        case 'R': col += 1; break; // Move right
        case 'FL': row -= 1; col -= 1; break; // Move forward-left
        case 'FR': row -= 1; col += 1; break; // Move forward-right
        case 'BL': row += 1; col -= 1; break; // Move backward-left
        case 'BR': row += 1; col += 1; break; // Move backward-right
    }

    if (isValidMove(fromPos, [row, col]) && !board[row][col]) {
        // Move the character on the board
        board[fromPos[0]][fromPos[1]] = '';
        board[row][col] = char;
        moveHistory.push(`${char} to [${row}, ${col}]`);
        return true;
    }
    return false;
}

wss.on('connection', (ws) => {
    if (players.length < 2) {
        players.push(ws);
        if (players.length === 2) {
            initializeBoard();
            players.forEach(playerWs => {
                playerWs.send(JSON.stringify({
                    type: 'init',
                    payload: {
                        board: board,
                        currentPlayer: getCurrentPlayer(),
                        moveHistory: moveHistory,
                    },
                }));
            });
        }
    } else {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Game is full!' } }));
    }

    ws.on('message', (message) => {
        const { type, payload } = JSON.parse(message);

        if (type === 'move') {
            const { playerName, char, move } = payload;
            const currentPlayer = getCurrentPlayer();
            if (playerName !== currentPlayer) {
                ws.send(JSON.stringify({ type: 'error', payload: { message: "Not your turn!" } }));
            } else {
                if (applyMove(char, move)) {
                    currentPlayerIndex = (currentPlayerIndex + 1) % 2;
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'update',
                                payload: {
                                    board: board,
                                    moveHistory: moveHistory,
                                    currentPlayer: getCurrentPlayer(),
                                },
                            }));
                        }
                    });
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: "Invalid move!" } }));
                }
            }
        }
    });
});

server.listen(8080, () => {
    console.log('Server started on port 8080');
});
