// 1. Initialize Firebase (Ensure your config is pasted here)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. Global State
let gameRef;
let myPlayerNum = 0; // 0 = not joined, 1 = P1, 2 = P2
let isMyTurn = false;
let opponentSecret = null;

// 3. Join Game Function
async function joinGame() {
    const roomID = document.getElementById('room-id').value.trim();
    const secret = parseInt(document.getElementById('my-secret').value);

    if (!roomID || isNaN(secret)) return alert("Enter Room Name & Secret!");

    gameRef = db.ref('rooms/' + roomID);
    
    // Check if room exists
    const snapshot = await gameRef.once('value');
    const data = snapshot.val();

    if (!data) {
        // Create Room as Player 1
        myPlayerNum = 1;
        await gameRef.set({
            p1_secret: secret,
            p2_secret: null,
            turn: 1,
            history: [],
            winner: null
        });
    } else if (!data.p2_secret) {
        // Join Room as Player 2
        myPlayerNum = 2;
        await gameRef.update({ p2_secret: secret });
    } else {
        return alert("Room is full!");
    }

    // Hide setup, start listening
    document.getElementById('setup-screen').classList.add('hidden');
    initGameListener();
}

// 4. Real-time Sync Listener
function initGameListener() {
    gameRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Determine turn and opponent secret
        isMyTurn = (data.turn === myPlayerNum);
        opponentSecret = (myPlayerNum === 1) ? data.p2_secret : data.p1_secret;

        // Update UI Status
        updateUIStatus(data);
        
        // Render History Loop
        if (data.history) renderHistory(data.history);

        // Check for Winner
        if (data.winner) {
            handleGameOver(data.winner);
        }
    });
}

// 5. Handling the Guess (The Loop)
document.getElementById('guess-form').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('guess-input');
    const guessVal = parseInt(input.value);

    if (!isMyTurn || !opponentSecret || isNaN(guessVal)) return;

    // Logic for Hint
    let hint = "";
    let won = false;

    if (guessVal === opponentSecret) {
        hint = "CORRECT!";
        won = true;
    } else {
        hint = guessVal < opponentSecret ? "Higher ↑" : "Lower ↓";
    }

    // Update Firebase
    const snap = await gameRef.once('value');
    const currentHistory = snap.val().history || [];
    
    currentHistory.push({
        p: myPlayerNum,
        g: guessVal,
        h: hint
    });

    const updates = {
        history: currentHistory,
        turn: (myPlayerNum === 1 ? 2 : 1)
    };

    if (won) updates.winner = myPlayerNum;

    await gameRef.update(updates);
    input.value = '';
};

// 6. UI Rendering Functions
function renderHistory(list) {
    const container = document.getElementById('history');
    container.innerHTML = ''; // Clear and redraw to maintain "Not removed" rule

    list.forEach(item => {
        const div = document.createElement('div');
        // If it's my guess, show on left (blue), if opponent, show on right (purple)
        const isMe = item.p === myPlayerNum;
        div.className = `flex w-full animate-pop ${isMe ? 'justify-start' : 'justify-end'}`;
        
        const bubbleClass = isMe ? 'p1-bubble' : 'p2-bubble';
        
        div.innerHTML = `
            <div class="${bubbleClass} px-4 py-3 shadow-lg max-w-[85%]">
                <div class="text-[9px] font-bold opacity-50 mb-1">PLAYER ${item.p}</div>
                <div class="flex items-center gap-3">
                    <span class="text-lg font-black">${item.g}</span>
                    <div class="w-[1px] h-4 bg-white/20"></div>
                    <span class="text-xs font-medium uppercase tracking-wider">${item.h}</span>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

function updateUIStatus(data) {
    const status = document.getElementById('status');
    if (!opponentSecret) {
        status.innerText = "Waiting for Opponent...";
    } else {
        status.innerText = isMyTurn ? "● YOUR TURN" : "● OPPONENT'S TURN";
        status.className = isMyTurn ? "text-blue-400 font-bold" : "text-slate-500";
    }
}
