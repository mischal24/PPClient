// mischalarkins06@gmail.com
// client.js

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("roleButtonList").style.display = "none";
    let buttons = document.getElementById("imageButtonList").getElementsByTagName("button");
    for (let button of buttons) {
        button.disabled = true;
    }
}, false);

let socket = new WebSocket("ws://10.0.0.194:9090");
let isConnected = false;

socket.onopen = () => {
    document.getElementById("status").innerText = "Connected to Server";
    isConnected = true;
};

let storedID;
let storedRole;

let guessedID;
let guessedRole;

let gameStarted = false;
let hasLost = false;

socket.onmessage = (event) => {
    console.log("Message from server:", event.data);

    try {
        let data = JSON.parse(event.data);

        switch (data.type) {
            case "start":
                gameStarted = true;
                console.log("Game started!");
                document.getElementById("imageButtonList").style.display = "none";
                break;

            case "id":
                storedID = data.id;
                break;
            
            case "roomfull":
                console.log("Room full");
                document.getElementById("nameQuery").style.display = "block";
                let buttons = document.getElementById("imageButtonList").getElementsByTagName("button");
                for (let button of buttons) {
                    button.disabled = true;
                }
                break;
                
            case "playerlist":
                document.querySelectorAll('.playerbutton').forEach(e => e.remove());
                
                for (let id in data.players) {
                    let name = data.players[id];
                
                    var playerButton = document.createElement("BUTTON");
                    playerButton.classList.add("playerbutton");
                    playerButton.setAttribute("data-player-id", id);
                    playerButton.textContent = name;
                
                    playerButton.onclick = () => {
                        storeCalloutTarget(id);
                    };
                
                    document.body.appendChild(playerButton);
                }
                break;
                
            case "playerrole":
                if (gameStarted === false) { return; }

                let role = data.role;
                storedRole = role;
                document.getElementById("role").innerText = role;
                
                switch (storedRole) {
                    case "Joke Thief":
                        document.getElementById("roleInfo").innerText = "Choose one player. This player cannot be changed. Once per topic change, you must find some way to repeat what the player says.";
                        break;
                    
                    case "Quiet Kid":
                        document.getElementById("roleInfo").innerText = "You can't speak unless asked a question by another player.";
                        break;
                
                    case "Know it All":
                        document.getElementById("roleInfo").innerText = "Choose one player. This player cannot be changed. Anything they say, you must disagree with.";
                        break;
                
                    case "Sheeple":
                        document.getElementById("roleInfo").innerText = "Choose one player. This player cannot be changed. Anything they say, you must agree with.";
                        break;
                
                    case "Gaslighter":
                        document.getElementById("roleInfo").innerText = "You must convince everyone of a player's role (even if you're wrong). You may change your target every topic change.";
                        break;
                
                    case "Chatterbox":
                        document.getElementById("roleInfo").innerText = "If you haven't spoken for the last two questions asked by players, you must join the conversation.";
                        break;
                
                    case "Comedian":
                        document.getElementById("roleInfo").innerText = "You have to slip in jokes once per topic, and make an extra joke for each player who laughs.";
                        break;
                
                    case "Philosopher":
                        document.getElementById("roleInfo").innerText = "Once per topic change, you must pause for a bit before a response.";
                        break;
                
                    case "Snowflake":
                        document.getElementById("roleInfo").innerText = "When questioned, you must dodge it, or pass the question to another player.";
                        break;
                
                    default:
                        document.getElementById("roleInfo").innerText = "Error providing info!";
                        break;
                }
                

                break;

            case "rolegrab":
                if (gameStarted === false) { return; }

                roleGrab();
                break;

            case "win":
                if (gameStarted === false) { return; }

                console.log("YOU WIN!");
                document.getElementById("imageButtonList").style.display = "none";
                document.getElementById("roleButtonList").style.display = "none";
                showPopup("Congrats on being the last one standing. Props to you!");
                break;

            case "lose":
                if (gameStarted === false) { return; }
                hasLost = true;

                console.log("YOU LOSE!");
                document.getElementById("imageButtonList").style.display = "none";
                document.getElementById("roleButtonList").style.display = "none";
                showPopup("Looks like your out! Don't feel too bad, you'll win next time.");
                break;
            
            case "end":
                gameStarted = false;
                hasLost = false;
                document.getElementById("imageButtonList").style.display = "block";
                break;

            default:
                console.warn("Unknown message type:", data.type);
                break;
        }
    } catch (error) {
        console.error("Failed to parse message:", error);
    }
};

function sendMessage(data) {
    if (isConnected === false) { return; }

    try {
        console.log("Sending:", data);
        socket.send(data);
    } catch (error) {
        console.error("Failed to send message:", error);
    }
}

function sendPlayer() {
    if (gameStarted === true) { return; }
    if (isConnected === false) { return; }

    let input = document.getElementById("message").value;

    if (input === "") {
        console.log("Invalid Name!");
        return;
    }

    const jsonData = JSON.stringify({
        type: "player",
        id: storedID,
        name: input
        //image: image
    });

    sendMessage(jsonData);

    document.getElementById("nameQuery").style.display = "none";
    let buttons = document.getElementById("imageButtonList").getElementsByTagName("button");
    for (let button of buttons) {
        button.disabled = false;
    }
}

function storeCalloutTarget(playerID) {
    if (gameStarted === false) { return; }
    if (hasLost === true) { return; }

    guessedID = playerID;
    console.log("Selected target:", guessedID);

    document.getElementById("roleButtonList").style.display = "block";
}

function storeCalloutRole(role) {
    if (gameStarted === false) { return; }
    if (hasLost === true) { return; }

    guessedRole = role;
    console.log("Selected role:", guessedRole);

    document.getElementById("roleButtonList").style.display = "none";
    sendCalloutInfo();
}

function sendCalloutInfo() {
    if (gameStarted === false) { return; }

    if (!guessedID || !guessedRole) {
        console.warn("Cannot send callout info - missing data.");
        return;
    }

    const jsonData = JSON.stringify({
        type: "callout",
        callerID: storedID,
        targetID: guessedID,
        guessedRole: guessedRole
    });

    sendMessage(jsonData);
}

function roleGrab() {
    if (gameStarted === false) { return; }

    const jsonData = JSON.stringify({
        type: "rolereceive",
        storedRole: storedRole
    });

    console.log(jsonData);
    sendMessage(jsonData);
}

function setPlayerImage(src, serverSrc) {
    if (gameStarted === true) { return; }

    document.getElementById("playerImage").src = src;

    const jsonData = JSON.stringify({
        type: "playerimage",
        id: storedID,
        src: serverSrc
    });

    sendMessage(jsonData);
}

function showPopup(text) {
    var popup = document.getElementById("popup");
    var popupText = document.getElementById("popupText")

    popup.style.display = "block";
    popupText.innerText = text;
}

function hidePopup() {
    var popup = document.getElementById("popup");
    popup.style.display = "none";
}

document.addEventListener("touchstart", hidePopup);
document.addEventListener("mousedown", hidePopup);

window.addEventListener("beforeunload", () => {
    const jsonData = JSON.stringify({
        type: "leaving",
        id: storedID
    });

    sendMessage(jsonData);
});
