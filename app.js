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

let sessions = [];


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
            case "GET_SESSION":
                con.send(JSON.stringify({
                    'message_type': 'SET_SESSION',
                    'session_id': "XXX"
                }));
                break;
        }
    });
});