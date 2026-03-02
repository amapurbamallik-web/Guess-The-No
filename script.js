let secretNumber;
let totalPlayers;
let currentPlayer = 1;

function startGame() {
    totalPlayers = Number(document.getElementById("players").value);
    secretNumber = Number(document.getElementById("secret").value);

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";

    document.getElementById("turn").innerText =
        "Player " + currentPlayer + "'s Turn";
}

function checkGuess() {
    let guess = Number(document.getElementById("guess").value);
    let result = document.getElementById("result");

    if (guess > secretNumber) {
        result.innerText = "⬇ Lower!";
    }
    else if (guess < secretNumber) {
        result.innerText = "⬆ Higher!";
    }
    else {
        result.innerText = "🎉 Player " + currentPlayer + " Wins!";
        return;
    }

    currentPlayer++;

    if (currentPlayer > totalPlayers) {
        currentPlayer = 1;
    }

    document.getElementById("turn").innerText =
        "Player " + currentPlayer + "'s Turn";

    document.getElementById("guess").value = "";
}
