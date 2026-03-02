// Initialize PeerJS - this gives the phone a unique ID
const peer = new Peer(); 
let conn; // The connection object
let mySecret, oppSecret;
let myTurn = false;
let myName = "";

// 1. Peer Server Connection: Show the ID for the "Host" section
peer.on('open', (id) => {
    console.log('My Peer ID is: ' + id);
    const idDisplay = document.getElementById('my-id-display');
    if(idDisplay) idDisplay.innerText = id;
});

// 2. HOST LOGIC: Always listen for someone trying to join your room
peer.on('connection', (incomingConn) => {
    if (conn) return; // Prevent multiple people from joining one session
    
    conn = incomingConn;
    myTurn = true; // Host typically goes first
    setupGameEvents();
});

// 3. JOIN LOGIC: Triggered when the user clicks "JOIN BATTLE"
document.getElementById('start-join-btn').onclick = () => {
    const targetRoomId = document.getElementById('room-id-input').value;
    
    if (!targetRoomId) return alert("Please enter a Room ID!");
    
    conn = peer.connect(targetRoomId);
    myTurn = false; // Joiner goes second
    setupGameEvents();
};

// 4. Setup Data Listeners & UI Transition
function setupGameEvents() {
    // Get latest values from inputs
    myName = document.getElementById('user-name').value || "Player";
    mySecret = document.getElementById('user-secret').value;

    if (!mySecret) {
        alert("Please enter your secret number before connecting!");
        return;
    }

    // When the P2P connection is fully established
    conn.on('open', () => {
        // Send your info to the opponent
        conn.send({ type: 'init', name: myName, secret: mySecret });
        
        // Transition UI
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        updateTurnUI();
    });

    // Handle incoming messages
    conn.on('data', (data) => {
        if (data.type === 'init') {
            // Received opponent's details
            document.getElementById('opp-name-display').innerText = data.name;
            oppSecret = data.secret;
            updateTurnUI();
        } else if (data.type === 'guess') {
            // Opponent made a guess (Player 2 in history)
            addHistoryEntry(2, data.value);
            myTurn = true;
            updateTurnUI();
        }
    });
    
    conn.on('close', () => {
        alert("Opponent left the game.");
        location.reload();
    });
}

// 5. Handle Guessing
document.getElementById('guess-form').onsubmit = (e) => {
    e.preventDefault();
    const input = document.getElementById('guess-input');
    const guessValue = input.value;

    if (!myTurn) return alert("Wait for your turn!");
    if (!guessValue) return;

    // Add to history (Player 1 is "Me")
    addHistoryEntry(1, guessValue);
    
    // Send guess to opponent
    conn.send({ type: 'guess', value: guessValue });
