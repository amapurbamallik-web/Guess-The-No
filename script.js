/* GuessTheNo - P2P Logic
    Uses PeerJS for WebRTC signaling
*/

const peer = new Peer(); 
let conn; 
let mySecret, oppSecret;
let myTurn = false;
let myName = "";

// 1. INITIALIZATION: Display the Room ID for the Host
peer.on('open', (id) => {
    const idDisplay = document.getElementById('my-id-display');
    if (idDisplay) idDisplay.innerText = id;
});

// 2. HOST LOGIC: Listen for a connection from a friend
peer.on('connection', (incomingConn) => {
    if (conn) return; // Prevent multiple joins
    conn = incomingConn;
    myTurn = true; // Host takes the first turn
    setupGameEvents();
});

// 3. JOIN LOGIC: Connect to a host using their Room ID
document.getElementById('start-join-btn').onclick = () => {
    const targetRoomId = document.getElementById('room-id-input').value.trim();
    if (!targetRoomId) return alert("Please enter a Room ID!");
    
    conn = peer.connect(targetRoomId);
    myTurn = false; // Joiner takes the second turn
    setupGameEvents();
};

// 4. GAME SYNC: Handle Data Exchange
function setupGameEvents() {
    myName = document.getElementById('user-name').value || "Player";
    mySecret = document.getElementById('user-secret').value;

    if (!mySecret) {
        alert("Set your secret number before entering battle!");
        location.reload();
        return;
    }

    conn.on('open', () => {
        // Send initial handshake data
        conn.send({ type: 'init', name: myName, secret: mySecret });
        
        // Transition UI
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        updateTurnUI();
    });

    conn.on('data', (data) => {
        if (data.type === 'init') {
            document.getElementById('opp-name-display').innerText = data.name;
            oppSecret = data.secret;
            updateTurnUI();
        } else if (data.type === 'guess') {
            addHistoryEntry(2, data.value); // 2 = Opponent
            myTurn = true;
            updateTurnUI();
        }
