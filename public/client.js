const ws = new WebSocket('ws://localhost:8080');

let selectedChar = null;

ws.onmessage = (message) => {
    const { type, payload } = JSON.parse(message.data);

    if (type === 'init' || type === 'update') {
        renderBoard(payload.board);
        document.getElementById('currentPlayer').innerText = `Current Player: ${payload.currentPlayer}`;
        renderMoveHistory(payload.moveHistory);
    }

    if (type === 'error') {
        document.getElementById('errorMessage').innerText = payload.message;
    }
};

function renderBoard(board) {
    const boardDiv = document.getElementById('board');
    boardDiv.innerHTML = ''; // Clear previous board
    board.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        row.forEach(cell => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell';
            cellDiv.innerText = cell || ''; // Display cell content or empty string
            if (cell) {
                cellDiv.onclick = () => selectCharacter(cell); // Click to select a character
            }
            rowDiv.appendChild(cellDiv);
        });
        boardDiv.appendChild(rowDiv);
    });
}

function selectCharacter(char) {
    selectedChar = char;
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('selected'));
    document.querySelectorAll('.cell').forEach(cell => {
        if (cell.innerText === char) {
            cell.classList.add('selected');
        }
    });
}

function renderMoveHistory(history) {
    const historyDiv = document.getElementById('moveHistory');
    historyDiv.innerHTML = '<h3>Move History</h3><ul>';
    history.forEach(move => {
        historyDiv.innerHTML += `<li>${move}</li>`;
    });
    historyDiv.innerHTML += '</ul>';
}

document.querySelectorAll('.move-options button').forEach(button => {
    button.onclick = () => {
        if (selectedChar) {
            const move = button.id;
            const playerName = document.getElementById('currentPlayer').innerText.split(': ')[1];
            ws.send(JSON.stringify({ type: 'move', payload: { playerName, char: selectedChar, move } }));
        } else {
            document.getElementById('errorMessage').innerText = 'Select a character first!';
        }
    };
});
