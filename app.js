const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const WebSocket = require("ws");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/static/", express.static('./src'));

let server = app.listen(3000, () => console.log('Example app listening on port 3000!'));


const ws = new WebSocket.Server({
    noServer: true,
    path: "/websockets",
});


server.on("upgrade", (request, socket, head) => {
    ws.handleUpgrade(request, socket, head, (websocket) => {
        ws.emit("connection", websocket, request);
    });
});

///////////////////////////////////
// MANAGE SERVER WIDE STATE HERE //
///////////////////////////////////

let queue = [];

let sessions = [];

class Session {
    session_id = false;
    player1 = {
        con: false,
        y: 0,
        score: 0,
    };
    player2 = {
        con: false,
        y: 0,
        score: 0,
    };
    constructor(p1, p2){
        this.player1.con = p1;
        this.player2.con = p2;
        this.session_id = "TEST1";
    }
    sendSession(){
        this.player1.con.send(JSON.stringify({
            'message_type': 'SET_SESSION',
            'session_id': this.session_id,
            'payer_id': "1"
        })); 
        this.player2.con.send(JSON.stringify({
            'message_type': 'SET_SESSION',
            'session_id': this.session_id,
            'payer_id': "2"
        })); 
    }
}


/////////////////////////
// HANDLE CLIENTS HERE //
/////////////////////////

ws.on("connection", (con, req)=>{
    con.on('message', (message)=>{
        let message_type = JSON.parse(message).message_type;
        switch(message_type){
            case "PING":
                con.send(JSON.stringify({
                    'message_type': 'PONG'
                }));        
                break;
            case "JOIN_QUEUE":
                con.send(JSON.stringify({
                    'message_type': 'JOINED_QUEUE',
                }));
                if(!(queue.indexOf(con) >= 0)){
                    queue.push(con);
                }                
                if(queue.length == 2){
                    let player1 = queue[0];
                    let player2 = queue[1];
                    queue.pop();
                    queue.pop();
                    sessions.push(new Session(player1, player2));
                    sessions[sessions.length - 1].sendSession();
                }
                break;
            case "START_GAME":
                con.send(JSON.stringify({
                }));
                break;
        }
    });
});