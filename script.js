// Initialize PeerJS - this gives the phone a unique ID
const peer = new Peer(); 
let conn; // The connection object
let mySecret, oppSecret;
let myTurn = false;

// 1. When the phone connects to the Peer server, show the ID
peer.on('open', (id) => {
    console.log('My Peer ID is: ' + id);
    document.getElementById('my-id-display').innerText = "Your ID: " + id;
});

// 2. Handle the "START BATTLE" click
document.getElementById('start-btn').onclick = () => {
    const name = document.getElementById('user-name').value;
    mySecret = document.getElementById('user-secret').value;
    const friendId = document.getElementById('target-id').value; // Peer ID of the other phone

    if (!name || !mySecret) return alert("Fill in your name and secret number!");

    if (friendId) {
        // Player 2: Connecting to Player 1
        conn = peer.connect(friendId);
        setupGameEvents(name);
    } else {
        // Player 1: Waiting for Player 2 to join
        alert("Waiting for opponent to enter your ID...");
        peer.on('connection', (incomingConn) => {
            conn = incomingConn;
            setupGameEvents(name);
        });
    }
};

// 3. Setup Data Listeners
function setupGameEvents(myName) {
    conn.on('open', () => {
        // Send your info to the opponent
        conn.send({ type: 'init', name: myName, secret: mySecret });
        
        // Transition UI from Join Screen to Game Screen
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
    });

    conn.on('data', (data) => {
        if (data.type === 'init') {
            // Received opponent's name and secret
            document.getElementById('opp-name').innerText = data.name;
            oppSecret = data.secret;
            // Player who didn't initiate the connection goes first (or vice versa)
            myTurn = !conn.peerInitiator; 
            updateTurnUI();
        } else if (data.type === 'guess') {
            // Opponent made a guess, show it in history
            addHistoryEntry(2, data.value);
            myTurn = true;
            updateTurnUI();
        }
    });
}

// 4. Handle Guessing
document.getElementById('guess-form').onsubmit = (e) => {
    e.preventDefault();
    if (!myTurn) return alert("It's not your turn!");

    const guess = document.getElementById('guess-input').value;
