// Initialize variables for the game state
let peer = null;
let conn = null;
let mySecret, oppSecret, myName, oppName;
let myTurn = false;

/**
 * START BATTLE: Triggered when the user clicks the button.
 * It uses the Room ID to either create a host or join as a peer.
 */
document.getElementById('start-btn').onclick = () => {
    const name = document.getElementById('user-name').value;
    const secret = document.getElementById('user-secret').value;
    const roomId = document.getElementById('room-id-input').value.trim().toLowerCase();

    if (!name || !secret || !roomId) return alert("Please fill all fields!");

    mySecret = parseInt(secret);
    myName = name;

    // Initialize Peer with the custom Room ID provided by the user
    peer = new Peer(roomId);

    peer.on('open', (id) => {
        console.log("Room Active: " + id);
        document.getElementById('start-btn').innerText = "WAITING FOR OPPONENT...";
        document.getElementById('start-btn').disabled = true;

        // Listener for when the second player joins this specific Room ID
        peer.on('connection', (incoming) => {
            conn = incoming;
            setupGameBridge();
        });
    });

    // If the Room ID is already taken, it means a host exists. Join them!
    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            console.log("Room occupied. Joining as Player 2...");
            peer = new Peer(); // Create a temporary ID for yourself to connect
            peer.on('open', () => {
                conn = peer.connect(roomId);
                setupGameBridge();
            });
        } else {
            alert("Connection Error: " + err.type);
        }
    });
};

/**
 * SETUP GAME BRIDGE: Manages the data exchange between the two phones.
 */
function setupGameBridge() {
