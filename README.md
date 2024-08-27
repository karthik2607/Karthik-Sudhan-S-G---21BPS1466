# Turn-Based Chess-Like Game

## Overview

This project is a turn-based, chess-like game that allows two players to compete in real-time over a WebSocket server. The game is played on a 5x5 grid where each player controls a team of characters, including Pawns, Hero1, and Hero2, each with unique movement and combat abilities. The game supports multi-client play with a room-based system.

## Features

- **Real-time Multiplayer**: Two players can connect to the server and play against each other in real time.
- **WebSocket Communication**: The game state is synchronized between clients using WebSocket for instant updates.
- **Room-Based System**: Supports multiple game instances running simultaneously in different rooms.
- **Customizable Characters**: Players can choose a combination of Pawns, Hero1, and Hero2 to create their team.
- **Turn-Based Gameplay**: Players take turns to move their characters with each character having specific movement rules.

## Project Structure

```bash
chess-like-game/
├── package.json          # Project dependencies and scripts
├── server.js             # WebSocket server handling game logic
└── public/
    ├── index.html        # Web client interface
    └── client.js         # Client-side JavaScript for game interaction


Clone the Repository
git clone https://github.com/your-username/chess-like-game.git
cd chess-like-game

Make sure you have Node.js installed. Then, run:
npm install

To run the server
node server.js


The server will start on http://localhost:3000.

Open the Game in a Browser

Open your web browser and navigate to http://localhost:3000.
You can open multiple tabs or use different devices to connect multiple clients.



![Game](public\Game.png)
