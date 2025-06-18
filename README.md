# Synerge - The Game of Collective Intuition

  <!-- Optional: Replace with a real screenshot of your game! -->

**Synerge** is a real-time, turn-based multiplayer web game where players collaborate to achieve perfect alignment. The goal is simple but challenging: can your team all choose the same number before the timer runs out?

This game is built with pure HTML, CSS, and vanilla JavaScript on the frontend, powered by a Node.js, Express, and Socket.IO backend.

**[▶️ Play the Live Demo Here!](https://your-app-name.onrender.com)** <!-- Replace with your live Render URL -->

---

## 🎯 How to Play

1.  **Create or Join a Room**: Enter your name. One player creates a room and gets a unique code to share. Others join using that code.
2.  **Wait in the Lobby**: The game starts when the "Host" (the room creator) clicks "Start Game". A minimum of 2 players is required.
3.  **Choose a Number**: In each round, you have a limited time to secretly choose a number from 1 to 10.
4.  **The Reveal**: Once all players have chosen or the timer runs out, the selections are revealed in a dramatic animation.
5.  **Achieve Synergy**:
    *   **Mismatch?** A new round begins automatically.
    *   **Success!** If everyone chose the same number, you win! The game ends, showing your team's stats.
6.  **Share Your Victory**: On the results screen, you can download an image of your score or share your victory directly to Twitter.

---

## ✨ Features

-   **Real-Time Multiplayer**: Seamless gameplay powered by WebSockets (Socket.IO).
-   **Host-Controlled Rooms**: The room creator controls when the game starts.
-   **Turn-Based Rounds**: A clear, round-based structure with a countdown timer for each round.
-   **Dramatic Result Reveal**: Suspenseful CSS animations for revealing player choices.
-   **Score & Time Tracking**: The final success screen displays rounds taken, total time, and a final score.
-   **Shareable Results**: Players can download a PNG of their results or share them on Twitter.
-   **Fully Responsive**: A clean, mobile-first design that looks great on any device.
-   **Zero Dependencies Frontend**: Built with pure vanilla HTML, CSS, and JavaScript.

---

## 🛠️ Tech Stack

-   **Frontend**: HTML5, CSS3 (with Flexbox/Grid), Vanilla JavaScript
-   **Backend**: Node.js, Express.js
-   **Real-Time Communication**: Socket.IO
-   **Image Capture**: [html2canvas](https://html2canvas.hertzen.com/) library
-   **Deployment**: [Render](https://render.com)

---

## 🚀 Running Locally

To run this project on your local machine, follow these steps.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18.0.0 or later recommended)
-   npm (included with Node.js)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install backend dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    npm start
    ```

4.  **Open the application:**
    Navigate to `http://localhost:3000` in your web browser. Open multiple tabs to simulate multiple players.

---

## 📁 File Structure

The project is organized into a simple and intuitive structure.

```
synerge/
├── public/
│   ├── index.html           # Main game screen (lobby, game, results)
│   ├── how-to-play.html     # Instructions page
│   ├── style.css            # All styles and animations
│   └── script.js            # All client-side JS and Socket.IO logic
│
├── .gitignore               # Specifies files for Git to ignore
├── server.js                # Node.js, Express, and Socket.IO server logic
├── package.json             # Project metadata and dependencies
└── README.md                # You are here!
```

---

## 💡 Future Improvements

-   [ ] Add sound effects for button clicks, timer countdown, and synergy success.
-   [ ] Implement private rooms with password protection.
-   [ ] Create a "spectator" mode for users to watch ongoing games.
-   [ ] Add different game modes (e.g., faster timer, more numbers).

---

_This project was created as a fun exercise in building a complete real-time web application from scratch._
