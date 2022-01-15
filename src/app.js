// paddle 1 #27AEB5
// paddle 2 #192338

// UI LIBRARY
class Button {
    text = "";
    fgcolor = "";
    bgcolor = "";
    width = 0;
    height = 0;
    x = 0;
    y = 0;
    textAlign = "center";
    font = "";
    hoverFGcolor = "";
    hoverBGcolor = "";
    currentFGColor = "";
    currentBGColor = "";

    onClickLeft = () => {};
    onClickMiddle = () => {};
    onClickRight = () => {};

    setText(text){
        this.text = text;
    }

    setFont(font, fgcolor, bgcolor, textAlign){
        this.font = font;
        this.fgcolor = fgcolor;
        this.bgcolor = bgcolor;
        this.currentFGColor = this.fgcolor;
        this.currentBGColor = this.bgcolor;  
        this.textAlign = textAlign;
    }

    setSize(width, height){
        this.width = width;
        this.height = height;
    }

    setHoverColor(fgcolor, bgcolor){
        this.hoverFGcolor = fgcolor;
        this.hoverBGcolor = bgcolor;
    }
    
    setPosition(x, y){
        this.x = x;
        this.y = y;
    }

    update(mouse_state){
        let x = mouse_state.pos.x >= this.x && mouse_state.pos.x <= this.x + this.width;
        let y = mouse_state.pos.y >= this.y && mouse_state.pos.y <= this.y + this.height;
        if(x && y){
            this.currentFGColor = this.hoverFGcolor;
            this.currentBGColor = this.hoverBGcolor;
            if(Game.storage.mouse.click.active){
                this.onClickLeft();
            }
        } else {
            this.currentFGColor = this.fgcolor;
            this.currentBGColor = this.bgcolor;    
        }
    }

    render(context){
        // draw rect
        context.fillStyle = this.currentBGColor;
        context.fillRect(this.x, this.y, this.width, this.height);
        // draw text        
        context.fillStyle = this.currentFGColor;
        context.font = this.font;
        context.textAlign = this.textAlign
        context.fillText(this.text, this.x + (this.width / 2), this.y + (this.height / 2) + 8, this.width);
    }
}

class Text {
    text = "";
    fgcolor = "";
    width = 0;
    height = 0;
    x = 0;
    y = 0;
    textAlign = "center";
    font = "";
    setText(text){
        this.text = text;
    }

    setFont(font, fgcolor, textAlign){
        this.font = font;
        this.fgcolor = fgcolor;
        this.textAlign = textAlign;
    }

    setSize(width, height){
        this.width = width;
        this.height = height;
    }

    setPosition(x, y){
        this.x = x;
        this.y = y;
    }

    render(context){
        // draw text        
        context.fillStyle = this.fgcolor;
        context.font = this.font;
        context.textAlign = this.textAlign
        context.fillText(this.text, this.x, this.y + (this.height / 2) + 8, this.width);
    }
}

// GAME CODE

let Game = {
    debug: true,
    title: "Multiplayer Pong",
    author: "Dean Van Greunen",
    date: "15 Jan 2022",
    FPS: 1000/60,
    timing: {
        fps: 0,
        elapsed: 0,
        current: 0,
        last: 0,
    },
    interval: false,
    running: false,
    storage: {
        state_menu: 0,
        state_game: 0,
        pongs: {
            player1: {
                x: 0,
                y: 0,
                width: 16,
                height: 128,
                score: 0,
            },
            player2: {
                x: 0,
                y: 0,
                width: 16,
                height: 128,
                score: 0,
            },
            ball : {
                radius: 8,
                x: 0,
                y: 0
            }
        },
        mouse: {
            pos: {
                x: 0,
                y: 0
            },
            click: {
                lastUp: 1000,
                lastDown: 0,
                active: false
            }
        },
        menu: {
            main: {
                start: false
            }
        }
    }, // USED FOR STORAGE DURING RUNTIME
    sizes: {
        WIDTH: '480',
        HEIGHT: '340'
    },
    networking: {
        websocket: null,
        enums: {
            message: Object.freeze({
                PING: "PING",
                GET_SESSION: "GET_SESSION",
                SET_SESSION: "SET_SESSION"
            }),
        },
        api: {
            init: (ip_address)=>{
                return new Promise((resolve)=>{
                    Game.networking.websocket = new WebSocket("ws://" + ip_address);
                    Game.networking.websocket.onopen = (e) => {
                        resolve("READY");
                    };
                    Game.networking.websocket.onmessage = (e) => {
                        Game.networking.api.receive(e);
                    };
                    Game.networking.websocket.onclose = (e) => {
                        Game.storage.state_menu = Game.enums.MENU.CONNECTIONLOST;
                    };
                });
            },
            ping: () => {
                Game.networking.websocket.send(JSON.stringify({
                    'message_type': Game.networking.enums.message.PING
                }));
            },
            send: (data) => {
                Game.networking.websocket.send(JSON.stringify(data));
            },
            sendMessage: (message_type) => {
                Game.networking.websocket.send(JSON.stringify({
                    'message_type': message_type
                }));
            },
            receive: (e) => {
                let message = JSON.parse(e.data);
                let message_type = message.message_type;
                switch(message_type){
                    case "PONG":
                        console.log("Server Detected");
                        break;
                    case "SET_SESSION":
                        console.log("Server Responsed with SESSION TOKEN");
                        break;
                }
            },
        },
    },
    enums: { // USED TO KEEP TRACK OF SAID MENU OR GAME STATE
        MENU : Object.freeze({
            SPLASH: 0,
            LOADING: 1,
            MAINMENU: 2,
            JOINQUICKMATCH: 3,
            WINNER: 4,
            LOOSER: 5,
            SETTINGS: 6,
            ABOUT: 7,
            GAME: 8,
            CONNECTIONLOST: 9
        }), 
        GAMESTATE : Object.freeze({
            NONE: 0,
            LOADING: 1,
            ACTIVE: 2,
            WINNER: 3,
            LOOSER: 4,
            CONNECTIONLOST: 5
        })
    },
    mouse_event_handler: (mouse) => {
        Game.storage.mouse.pos = {
            x: mouse.offsetX,
            y: mouse.offsetY
        };
    },
    mouse_up_handler: (mouse) => {
        Game.storage.mouse.click.lastUp = new Date().getTime(); //performance.now();
        Game.storage.mouse.click.active = false;
    },
    mouse_down_handler: (mouse) => {
        Game.storage.mouse.click.lastDown = new Date().getTime(); //performance.now();
        Game.storage.mouse.click.active = true;
    },
    init: async (ip_address) => { // SETUP UI AND MENU INFO
        return new Promise(async (resolve)=>{
            // INIT SERVER CONNECTION
            await Game.networking.api.init(ip_address);
            Game.networking.api.ping();

            // INIT GAME
            Game.storage.state_menu = Game.enums.MENU.SPLASH;
            Game.storage.state_game = Game.enums.GAMESTATE.NONE;
            Game.storage.canvas = document.getElementById('canvas');
            Game.storage.canvas.style.borderRadius = "16px";
            Game.storage.canvas.onmousemove = Game.mouse_event_handler;
            Game.storage.canvas.onmousedown = Game.mouse_down_handler;
            Game.storage.canvas.onmouseup = Game.mouse_up_handler;
            Game.storage.context = Game.storage.canvas.getContext("2d");
            Game.timing.fps = 0;
            Game.timing.elapsed = 0;
            Game.timing.current = performance.now();
            Game.timing.last  = performance.now()
            Game.running = true;

            Game.storage.splashCounter = 1000; // SPLASH IN MS

            // - main menu
            Game.storage.menu.main = {};
            Game.storage.menu.main.start = new Button();
            Game.storage.menu.main.start.setText("Quick Game");
            Game.storage.menu.main.start.setSize(200, 64);
            Game.storage.menu.main.start.setFont("400 22px Raleway", "#F0D66B", "#192338", "center");
            Game.storage.menu.main.start.setHoverColor("#192338", "#F0D66B");
            Game.storage.menu.main.start.setPosition((Game.sizes.WIDTH / 2) - (200 / 2) , (Game.sizes.HEIGHT / 2) - 98);
            Game.storage.menu.main.start.onClickLeft = ()=>{
                Game.storage.pongs.player1.x = 0;
                Game.storage.pongs.player1.y = (Game.sizes.HEIGHT / 2) - (Game.storage.pongs.player1.height / 2);
                Game.storage.pongs.player2.x = Game.sizes.WIDTH - Game.storage.pongs.player2.width;
                Game.storage.pongs.player2.y = (Game.sizes.HEIGHT / 2) - (Game.storage.pongs.player2.height / 2);
                Game.storage.pongs.ball.x = (Game.sizes.WIDTH / 2) - (Game.storage.pongs.ball.radius);
                Game.storage.pongs.ball.y = (Game.sizes.HEIGHT / 2) - (Game.storage.pongs.ball.radius);
                Game.storage.state_menu = Game.enums.MENU.GAME;
                Game.storage.state_game = Game.enums.GAMESTATE.LOADING;
                Game.networking.api.sendMessage(Game.networking.enums.message.GET_SESSION);          
            }

            Game.storage.menu.main.about = new Button();
            Game.storage.menu.main.about.setText("About");
            Game.storage.menu.main.about.setSize(200, 64);
            Game.storage.menu.main.about.setFont("400 22px Raleway", "#F0D66B", "#192338", "center");
            Game.storage.menu.main.about.setHoverColor("#192338", "#F0D66B");
            Game.storage.menu.main.about.setPosition((Game.sizes.WIDTH / 2) - (200 / 2) , (Game.sizes.HEIGHT / 2) + 32);
            Game.storage.menu.main.about.onClickLeft = ()=>{
                Game.storage.state_menu = Game.enums.MENU.ABOUT;
            }

            // - about menu 
            Game.storage.menu.about = {};
            Game.storage.menu.about.about1 = new Text();
            Game.storage.menu.about.about1.setText("Version: 1.0-beta");
            Game.storage.menu.about.about1.setSize(200, 128);
            Game.storage.menu.about.about1.setFont("400 22px Raleway", "#F0D66B", "#192338", "center");
            Game.storage.menu.about.about1.setPosition((Game.sizes.WIDTH / 2) - (200 / 2) , (Game.sizes.HEIGHT / 2) - 98);

            
            Game.storage.menu.about.about2 = new Text();
            Game.storage.menu.about.about2.setText("Thanks for the support");
            Game.storage.menu.about.about2.setSize(200, 128);
            Game.storage.menu.about.about2.setFont("400 22px Raleway", "#F0D66B", "#192338", "center");
            Game.storage.menu.about.about2.setPosition((Game.sizes.WIDTH / 2) - (200 / 2) , (Game.sizes.HEIGHT / 2) - 32);


            Game.storage.menu.about.back = new Button();
            Game.storage.menu.about.back.setText("Back");
            Game.storage.menu.about.back.setSize(200, 64);
            Game.storage.menu.about.back.setFont("400 22px Raleway", "#F0D66B", "#192338", "center");
            Game.storage.menu.about.back.setHoverColor("#192338", "#F0D66B");
            Game.storage.menu.about.back.setPosition((Game.sizes.WIDTH / 2) - (200 / 2) , (Game.sizes.HEIGHT / 2) + 98);
            Game.storage.menu.about.back.onClickLeft = ()=>{
                Game.storage.state_menu = Game.enums.MENU.MAINMENU;
            }
            resolve();
        });
    },
    input: () => {

    },
    update: (mouse_states) =>{
        switch(Game.storage.state_menu){
            case Game.enums.MENU.SPLASH:
                if(Game.storage.splashCounter <= 0){
                    Game.storage.state_menu = Game.enums.MENU.MAINMENU;
                } else {
                    Game.storage.splashCounter-= Game.timing.elapsed;
                }
                break;
            case Game.enums.MENU.MAINMENU:
                Game.storage.menu.main.start.update(mouse_states);
                Game.storage.menu.main.about.update(mouse_states);
                break;
            case Game.enums.MENU.ABOUT:
                Game.storage.menu.about.back.update(mouse_states);
                break;
            case Game.enums.MENU.GAME:
                Game.storage.pongs.player1.y = mouse_states.pos.y - (Game.storage.pongs.player1.height / 2);
                if(Game.storage.pongs.player1.y <= 0){
                    Game.storage.pongs.player1.y = 0;
                } else if (Game.storage.pongs.player1.y + Game.storage.pongs.player1.height >= Game.sizes.HEIGHT){
                    Game.storage.pongs.player1.y =  Game.sizes.HEIGHT - Game.storage.pongs.player1.height;
                }
                break;
        }
        Game.storage.mouse.click.active = false;
    },
    render: (context) => {
        // clear
        context.fillStyle = '#FF4E76';
        context.fillRect(0, 0, Game.sizes.WIDTH, Game.sizes.HEIGHT);

        if(Game.debug){
            // fps        
            context.fillStyle = 'rgb(255, 0, 0)';
            context.font = "400 12px Raleway";
            context.textAlign = "left";
            context.fillText(Game.timing.fps.toFixed(0) + " FPS", 8, 16);
        }
        // render
        switch(Game.storage.state_menu){
            case Game.enums.MENU.SPLASH:
                context.fillStyle = 'rgb(255, 255, 255)';
                context.font = "200 30px Raleway";
                context.textAlign = "center";
                context.fillText(Game.title, (Game.sizes.WIDTH / 2), (Game.sizes.HEIGHT / 2) - 32);
                context.fillText("By " + Game.author, (Game.sizes.WIDTH / 2), (Game.sizes.HEIGHT / 2 + 32));
                break;
            case Game.enums.MENU.MAINMENU:
                Game.storage.menu.main.start.render(context);
                Game.storage.menu.main.about.render(context);
                break;                
            case Game.enums.MENU.ABOUT:
                Game.storage.menu.about.about1.render(context);
                Game.storage.menu.about.about2.render(context);
                Game.storage.menu.about.back.render(context);
                break;  
            case Game.enums.MENU.LOADING:
                context.fillStyle = 'rgb(255, 255, 255)';
                context.font = "200 30px Raleway";
                context.textAlign = "center";
                context.fillText("LOADING", (Game.sizes.WIDTH / 2), (Game.sizes.HEIGHT / 2) - 32);
                context.fillText("PLEASE WAIT", (Game.sizes.WIDTH / 2), (Game.sizes.HEIGHT / 2 + 32));
                break;
            case Game.enums.MENU.CONNECTIONLOST:
                context.fillStyle = 'rgb(255, 255, 255)';
                context.font = "200 30px Raleway";
                context.textAlign = "center";
                context.fillText("CONNECTION LOST", (Game.sizes.WIDTH / 2), (Game.sizes.HEIGHT / 2) - 32);
                break;
            case Game.enums.MENU.GAME:
                switch(Game.storage.state_game){
                    case Game.enums.GAMESTATE.LOADING:
                        context.fillStyle = 'rgb(255, 255, 255)';
                        context.font = "200 30px Raleway";
                        context.textAlign = "center";
                        context.fillText("LOADING", (Game.sizes.WIDTH / 2), (Game.sizes.HEIGHT / 2) - 32);
                        context.fillText("PLEASE WAIT", (Game.sizes.WIDTH / 2), (Game.sizes.HEIGHT / 2 + 32));    
                        break;
                    case Game.enums.GAMESTATE.ACTIVE:
                        context.fillStyle = "#FFFFFF";
                        context.font = "200 30px Raleway";
                        context.textAlign = "center";
                        let score =  String(Game.storage.pongs.player1.score).padStart(2, '0') + " : " + String(Game.storage.pongs.player2.score).padStart(2, '0');
                        context.fillText(score, (Game.sizes.WIDTH / 2), 32);
                        context.fillStyle = "#192338";
                        context.fillRect(Game.storage.pongs.player1.x, Game.storage.pongs.player1.y, Game.storage.pongs.player1.width, Game.storage.pongs.player1.height);
                        context.fillStyle = "#192338";
                        context.fillRect(Game.storage.pongs.player2.x, Game.storage.pongs.player2.y, Game.storage.pongs.player2.width, Game.storage.pongs.player2.height);                        
                        context.beginPath();
                        context.arc(Game.storage.pongs.ball.x, Game.storage.pongs.ball.y, Game.storage.pongs.ball.radius, 0, 2 * Math.PI, false);
                        context.fillStyle = "#000000";
                        context.fill();
                        context.lineWidth = 0;
                        context.strokeStyle = '#000000';
                        context.stroke();
                        context.endPath();
                        break;
                }
                break;
        }
    },
    loop: () => {
        if(!Game.running){
            clearInterval(Game.interval);
            return;
        }
        let mouse_states = Game.storage.mouse;
        Game.timing.current = performance.now();
        Game.timing.elapsed = Game.timing.current - Game.timing.last;
        Game.timing.last = Game.timing.current;
        Game.timing.fps = 1000 / Game.timing.elapsed;
        Game.input();
        Game.update(mouse_states);
        Game.render(Game.storage.context);
    },
    start: async (ip_address) => {
        await Game.init(ip_address);
        Game.interval = setInterval(Game.loop,Game.FPS);
    }
};

(()=>{Game.start("127.0.0.1:3000/websockets");})();
