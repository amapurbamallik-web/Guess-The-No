const io = require("socket.io")(3000, {
  cors: { origin: "*" }
});

let rooms = {}; // Stores { roomID: { p1: {id, secret}, p2: {id, secret}, turn: id } }

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // 1. Join a Room
  socket.on("join-game", (roomID, secret) => {
    socket.join(roomID);
    
    if (!rooms[roomID]) {
      rooms[roomID] = { p1: { id: socket.id, secret }, turn: socket.id };
      socket.emit("message", "Waiting for opponent...");
    } else {
      rooms[roomID].p2 = { id: socket.id, secret };
      io.to(roomID).emit("game-start", { firstTurn: rooms[roomID].p1.id });
    }
  });

  // 2. Handle Guesses
  socket.on("send-guess", (roomID, guess) => {
    const room = rooms[roomID];
    const isP1 = socket.id === room.p1.id;
    const opponentSecret = isP1 ? room.p2.secret : room.p1.secret;
    
    let result = "";
    if (guess == opponentSecret) result = "win";
    else result = guess < opponentSecret ? "higher" : "lower";

    // Broadcast the result to BOTH players
    io.to(roomID).emit("receive-hint", {
      player: isP1 ? 1 : 2,
      guess: guess,
      hint: result
    });

    // Switch Turns
    room.turn = isP1 ? room.p2.id : room.p1.id;
    io.to(roomID).emit("turn-change", room.turn);
  });
});
