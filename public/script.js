document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // --- DOM Elements ---
    const screens = {
        landing: document.getElementById('landing-screen'),
        lobby: document.getElementById('lobby-screen'),
        game: document.getElementById('game-screen'),
        reveal: document.getElementById('reveal-screen'),
        success: document.getElementById('success-screen'),
    };
    
    const playerNameInput = document.getElementById('playerName');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const joinRoomInput = document.getElementById('joinRoomInput');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const errorMessage = document.getElementById('error-message');
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const playerList = document.getElementById('player-list');
    const hostControls = document.getElementById('host-controls');
    const startGameBtn = document.getElementById('startGameBtn');
    const lobbyStatus = document.getElementById('lobby-status');
    const roundTitle = document.getElementById('round-title');
    const numberGrid = document.getElementById('number-grid');
    const choiceStatus = document.getElementById('choice-status');
    const revealArea = document.getElementById('reveal-area');
    const revealStatus = document.getElementById('reveal-status');
    const hostEndGameControls = document.getElementById('host-end-game-controls');
    const guestEndGameStatus = document.getElementById('guest-end-game-status');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const toast = document.getElementById('toast-notification');
    const timerProgress = document.getElementById('timer-progress');
    const timerDisplay = document.getElementById('timer-display');
    const finalRoundsDisplay = document.getElementById('final-rounds-display');
    const finalScoreDisplay = document.getElementById('final-score-display');
    const totalTimeDisplay = document.getElementById('total-time-display');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const resultsCard = document.getElementById('results-card');

    // --- State ---
    let currentRoomCode = null;
    let myPlayerId = null;
    let clientTimerInterval = null;
    let hasSubmittedChoice = false;
    let finalGameResults = {};

    // --- Utility Functions ---
    const showScreen = (screenName) => {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    };
    
    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // --- Socket.IO Handlers ---
    socket.on('connect', () => { myPlayerId = socket.id; });
    socket.on('disconnect', () => { clearInterval(clientTimerInterval); });

    socket.on('joinSuccess', (roomCode) => {
        currentRoomCode = roomCode;
        errorMessage.textContent = '';
        roomCodeDisplay.textContent = roomCode;
        showScreen('lobby');
    });

    socket.on('updateLobby', ({ players, hostId }) => {
        playerList.innerHTML = '';
        players.forEach(player => {
            const playerEl = document.createElement('div');
            playerEl.className = 'player-item';
            playerEl.textContent = player.name;
            if (player.isHost) {
                const hostBadge = document.createElement('span');
                hostBadge.className = 'host-badge';
                hostBadge.textContent = 'Host';
                playerEl.appendChild(hostBadge);
            }
            playerList.appendChild(playerEl);
        });
        
        const isHost = myPlayerId === hostId;
        if (screens.lobby.classList.contains('active')) {
            hostControls.style.display = isHost ? 'block' : 'none';
            lobbyStatus.style.display = isHost ? 'none' : 'block';
            startGameBtn.disabled = players.length < 2;
        }
    });

    socket.on('gameStarted', ({ round, duration }) => {
        hasSubmittedChoice = false;
        setupGameScreen(round, duration);
        showScreen('game');
    });

    socket.on('roundResult', ({ results, isSynergy, timedOut }) => {
        clearInterval(clientTimerInterval);
        showScreen('reveal');
        revealResults(results, isSynergy, timedOut);
    });

    socket.on('synergyAchieved', ({ round, score, totalTime, hostId }) => {
        const timeInSeconds = Math.round(totalTime / 1000);
        finalGameResults = { round, score, timeInSeconds };

        finalRoundsDisplay.textContent = round;
        finalScoreDisplay.textContent = score;
        totalTimeDisplay.textContent = `${timeInSeconds}s`;

        showScreen('success');

        const isHost = myPlayerId === hostId;
        hostEndGameControls.style.display = isHost ? 'block' : 'none';
        guestEndGameStatus.style.display = isHost ? 'none' : 'block';
    });

    socket.on('gameEndedByDisconnect', (message) => {
        clearInterval(clientTimerInterval);
        showToast(message);
        showScreen('lobby');
    });

    socket.on('error', (message) => { errorMessage.textContent = message; });

    // --- Event Listeners ---
    createRoomBtn.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (!playerName) { errorMessage.textContent = 'Please enter your name.'; return; }
        errorMessage.textContent = '';
        socket.emit('createRoom', { playerName });
    });

    joinRoomBtn.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        const roomCode = joinRoomInput.value.trim().toUpperCase();
        if (!playerName) { errorMessage.textContent = 'Please enter your name.'; return; }
        if (!roomCode) { errorMessage.textContent = 'Please enter a room code.'; return; }
        errorMessage.textContent = '';
        socket.emit('joinRoom', { roomCode, playerName });
    });

    copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(currentRoomCode).then(() => showToast('Room code copied!'));
    });

    startGameBtn.addEventListener('click', () => socket.emit('startGame', currentRoomCode));
    playAgainBtn.addEventListener('click', () => socket.emit('requestNewGame', currentRoomCode));

    downloadBtn.addEventListener('click', () => {
        const actionButtons = document.querySelector('.results-actions');
        actionButtons.style.visibility = 'hidden';

        html2canvas(resultsCard).then(canvas => {
            actionButtons.style.visibility = 'visible';
            const link = document.createElement('a');
            link.download = 'synerge-results.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    shareBtn.addEventListener('click', () => {
        const { round, score, timeInSeconds } = finalGameResults;
        const text = `We achieved Synergy in ${round} round(s) with a score of ${score} in just ${timeInSeconds}s! Can you beat our record?%0A%0APlay Synerge now!%0A%0A%23SynergeGame`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
        window.open(twitterUrl, '_blank');
    });

    // --- Game Logic Functions ---
    function setupGameScreen(round, duration) {
        roundTitle.textContent = `Round ${round}`;
        choiceStatus.textContent = 'Choose your number.';
        numberGrid.innerHTML = '';
        hasSubmittedChoice = false;
        
        for (let i = 1; i <= 10; i++) {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.textContent = i;
            btn.dataset.number = i;
            btn.addEventListener('click', handleNumberSubmit);
            numberGrid.appendChild(btn);
        }
        
        startClientTimer(duration);
    }

    function startClientTimer(duration) {
        clearInterval(clientTimerInterval);
        let timeLeft = duration;
        timerDisplay.textContent = timeLeft;
        
        timerProgress.style.transition = 'none';
        timerProgress.style.height = '100%';
        void timerProgress.offsetWidth; // Force reflow
        timerProgress.style.transition = `height ${duration}s linear`;
        timerProgress.style.height = '0%';
        
        clientTimerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = Math.max(0, timeLeft);
            if (timeLeft < 0) clearInterval(clientTimerInterval);
        }, 1000);
    }

    function handleNumberSubmit(e) {
        if (hasSubmittedChoice) return;
        
        const selectedBtn = e.target;
        const number = parseInt(selectedBtn.dataset.number, 10);
        
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('selected');
        });
        selectedBtn.classList.add('selected');
        
        hasSubmittedChoice = true;
        choiceStatus.textContent = 'Your choice is locked in. Waiting for others...';
        socket.emit('submitNumber', { roomCode: currentRoomCode, number });
    }

    function revealResults(results, isSynergy, timedOut) {
        revealArea.innerHTML = '';
        revealStatus.textContent = '';
        revealStatus.className = 'reveal-status-text';
        
        results.forEach((result, index) => {
            const card = document.createElement('div');
            card.className = 'reveal-card';
            card.innerHTML = `
                <div class="card-face card-back"></div>
                <div class="card-face card-front">
                    <div class="card-player-name">${result.name}</div>
                    <div class="card-player-choice">${result.choice}</div>
                </div>
            `;
            revealArea.appendChild(card);
            setTimeout(() => card.classList.add('is-flipped'), (index + 1) * 600);
        });

        setTimeout(() => {
            if (isSynergy) {
                revealStatus.textContent = 'SYNERGY!';
                revealStatus.classList.add('success');
            } else if (timedOut) {
                revealStatus.textContent = "TIME'S UP!";
                revealStatus.classList.add('failure');
            } else {
                revealStatus.textContent = 'MISMATCH!';
                revealStatus.classList.add('failure');
            }
        }, results.length * 600 + 300);
    }

    showScreen('landing');
});