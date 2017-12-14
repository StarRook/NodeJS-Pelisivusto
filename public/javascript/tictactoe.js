const username = document.querySelector('#username').innerHTML;
const id = document.querySelector('#id').innerHTML;
let room = 'tictactoelobby';
let playersList = document.querySelector('#playerList');
let gamesList = document.querySelector('#gameRooms');
const lahetaButton = document.querySelector('#sendButton');
const textArea = document.querySelector('#chat-text');
const createGameButton = document.querySelector('#createButton');
const lobbyContainer = document.querySelector('#lobby');
const gameContainer = document.querySelector('#game');
const ruudut = document.querySelectorAll('th');

let gameroomID = null;

createGameButton.addEventListener('click', ()=>{
    const lastRoom = room;
    room = 'tictactoegame';
    socket.emit('newTicTacToeRoom', {
        id: id,
        username: username,
        lastRoom: lastRoom,
        room: room
    });
    lobbyContainer.classList.add('hidden');
    gameContainer.classList.remove('hidden');
})

lahetaButton.addEventListener('click', ()=>{
    if(document.querySelector('#textField').value != ''){
        const message = document.querySelector('#textField').value;
        document.querySelector('#textField').value = '';
        socket.emit('newTicTacToeLobbyMessage', {
            message: message,
            username: username
        });
    }
})

ruudut.forEach((el)=>{
    el.addEventListener('click', ()=>{
        socket.emit('updateRoom', {
            id: gameroomID,
            from: username,
            square: el.id
        })
    })
});

socket.on('connect', ()=>{

    const package = {
        room: room,
        username: username,
        id: id
    }

    socket.emit('room', package);    
});

socket.on('message', (data)=>{
    playersList.innerHTML = '';
    data.users.forEach((el)=>{
        playersList.innerHTML += '<li>'+el+'</li>';
    })
})

socket.on('gamerooms', (data)=>{
    gamesList.innerHTML = '';
    data.rooms.forEach((el)=>{
        gamesList.innerHTML += '<li>'+el.player1+' <button id='+el.id+'room'+' class="btn btn-small btn-success joiningbutton">JOIN</button></li>';
    })
    const joinbuttons = document.querySelectorAll('.joiningbutton');
    joinbuttons.forEach((el)=>{
        el.addEventListener('click', ()=>{
            //emittaa serverille tieto mihin roomiin halutaan joinata
            socket.emit('joinTicTacToeRoom', {
                id: id,
                username: username,
                lastRoom: room,
                room: 'tictactoegame',
                gameID: el.id[0]+el.id[1]
            });
            console.log(el.id[0]+el.id[1]);
            //näytä ristinolla
            lobbyContainer.classList.add('hidden');
            gameContainer.classList.remove('hidden');
        })
    })
})

socket.on('newMessage', (data)=>{
    textArea.innerHTML += '<div><strong>'+data.from+'</strong> '+data.message+'</div>';
    textArea.scrollTop = textArea.scrollHeight;
})

socket.on('gameStarted', (data)=>{
    gameroomID = data.gameRoom.id;
    document.querySelector('#gameHeader').innerHTML = data.gameRoom.player1 + ' vs. ' + data.gameRoom.player2;
})

socket.on('winner', (data)=>{
    let gameRoom = data.gameRoom;
    //aseta merkit taululle
    for(let i = 1; i<10; i++){
        if(gameRoom.squares[i-1] == 'X' || gameRoom.squares[i-1] == 'O'){
            document.querySelector('#s'+i).innerHTML = gameRoom.squares[i-1];
        }
    }
    document.querySelector('#gameHeader').innerHTML = data.gameRoom.winner + ' WON!';
})

socket.on('incomingUpdate', (data)=>{
    let gameRoom = data.gameRoom;
    //aseta merkit taululle
    for(let i = 1; i<10; i++){
        if(gameRoom.squares[i-1] == 'X' || gameRoom.squares[i-1] == 'O'){
            document.querySelector('#s'+i).innerHTML = gameRoom.squares[i-1];
        }
    }
})