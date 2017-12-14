module.exports = exports = function(server){
        server.listen(2000);
        const io = require('socket.io')(server, {});

        SOCKET_LIST = {};
        TICTACTOEGAMEROOM_LIST = {};

        io.sockets.on('connection', (socket)=>{
          //socket poistetaan socket listasta kun se disconnectaa
          socket.on('disconnect', ()=>{
            delete SOCKET_LIST[socket.id];
            delete TICTACTOEGAMEROOM_LIST[socket.id];
            updateGamerooms();
          })

          //laitetaan socket johonkin roomiin mikä saadaan itse clientiltä ja annetaan sille tiedot
          socket.on('room', (data)=>{
            socket.huone = data.room;
            socket.id = data.id;
            socket.username = data.username;
            SOCKET_LIST[data.id] = socket;
          })

          //lobbyn messaget
          socket.on('newTicTacToeLobbyMessage', (data)=>{
            for(let i in SOCKET_LIST){
              let socket = SOCKET_LIST[i];
              if(socket.huone == "tictactoelobby"){
                socket.emit('newMessage', {
                  message: data.message,
                  from: data.username
                });
              }
            }
          })

          socket.on('newTicTacToeRoom', (data)=>{
            let socket = SOCKET_LIST[data.id];
            let ruudut = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
            socket.huone = data.room+data.id;
            TICTACTOEGAMEROOM_LIST[data.id] = {
              game: 'tictactoe',
              id: data.id,
              player1: data.username,
              player2: '',
              turn: data.username,
              nextMark: 'X',
              squares: ruudut,
              winner: '',
              playing: false
            };
            updateGamerooms();
          })

          socket.on('joinTicTacToeRoom', (data)=>{
            let socket = SOCKET_LIST[data.id];
            socket.huone = data.room+data.gameID;
            let gameRoom = TICTACTOEGAMEROOM_LIST[data.gameID];
            gameRoom.player2 = data.username;
            gameRoom.playing = true;
            TICTACTOEGAMEROOM_LIST[data.gameID] = gameRoom;

            //emittaa tieto että peli alkanut pelihuoneessa oleville socketeille
            for(let i in SOCKET_LIST){
              let socket = SOCKET_LIST[i];
              if(socket.username == gameRoom.player1 || socket.username == gameRoom.player2){
                socket.emit('gameStarted', {
                  gameRoom: gameRoom
                })
              }
            }
            updateGamerooms();
          })

          socket.on('updateRoom', (data)=>{
            //haetaan oikea pelihuone
            let gameroom = TICTACTOEGAMEROOM_LIST[data.id];
            //onko peli käynnissä?
            if(gameroom.playing){
              if(gameroom.turn == data.from){
                //oikean henkilön vuoro voidaan jatkaa
                dataSquare = data.square[1];
                squareToChange = dataSquare - 1;
                if(gameroom.squares[squareToChange] != 'X' && gameroom.squares[squareToChange] != 'O'){
                  //ruutu tyhjä voidaan asettaa siihen merkki
                  gameroom.squares[squareToChange] = gameroom.nextMark;
                  //vaihdetaan seuraava merkki
                  if(gameroom.nextMark == 'X'){
                    gameroom.nextMark = 'O';
                  }else{
                    gameroom.nextMark = 'X';
                  }
                  //check winner ja jos winner emittaa winmessage muuten normaali message että peli jatkuu
                  if(checkWinner(gameroom.squares)){
                      let winnerID = "";
                      let player1ID = "";
                      let player2ID = "";

                      for(let i in SOCKET_LIST){
                          let socket = SOCKET_LIST[i];
                          if(gameroom.turn == socket.username){
                              winnerID = socket.id;
                              console.log('Löytyi winner ID');
                          }
                      }

                      for(let i in SOCKET_LIST){
                          let socket = SOCKET_LIST[i];
                          if(gameroom.player1 == socket.username){
                              player1ID = socket.id;
                              console.log('Löytyi player1 ID');
                          }
                      }

                      for(let i in SOCKET_LIST){
                          let socket = SOCKET_LIST[i];
                          if(gameroom.player2 == socket.username){
                              player2ID = socket.id;
                              console.log('Löytyi player2 ID');
                          }
                      }

                      const conn = require('../../lib/dbconn.js');
                      conn.connect(()=>{
                          console.log('INSERT INTO history (Player1ID, Player2ID, GameID, GameDate, Winner, GameStart, GameEnd) VALUES ('+player1ID+','+player2ID+','+gameroom.id
                              +','+Date.now()+','+winnerID+','+Date.now()+','+Date.now()+')');
                          conn.query('INSERT INTO history (Player1ID, Player2ID, GameID, GameDate, Winner, GameStart, GameEnd) VALUES ('+player1ID+','+player2ID+','+gameroom.id
                              +','+Date.now()+','+winnerID+','+Date.now()+','+Date.now()+')');
                      })
                    gameroom.playing = false;
                    gameroom.winner = gameroom.turn;
                    for(let i in SOCKET_LIST){
                      let socket = SOCKET_LIST[i];
                      if(socket.username == gameroom.player1 || socket.username == gameroom.player2){
                        socket.emit('winner', {
                          gameRoom: gameroom
                      });
                      }
                    }
                  }else{
                    //vaihdetaan seuraavan vuoroon
                    if(gameroom.turn == gameroom.player1){
                      gameroom.turn = gameroom.player2;
                    }else{
                      gameroom.turn = gameroom.player1;
                    }
                    //emittaa pelin uusi tilanne kummallekin pelaajalle
                    for(let i in SOCKET_LIST){
                      let socket = SOCKET_LIST[i];
                      if(socket.username == gameroom.player1 || socket.username == gameroom.player2){
                        socket.emit('incomingUpdate', {
                          gameRoom: gameroom
                      });
                      }
                    }
                  }
                }
              }
            }
          })

        });

        //Updatetaan TicTacToeplayerlist 0.5sekunin välein
        setInterval(()=>{
          const users = [];
          for(let i in SOCKET_LIST){
            let socket = SOCKET_LIST[i];
            if(socket.huone == 'tictactoelobby'){
              users.push(socket.username);
            }
          }
          for(let i in SOCKET_LIST){
            let socket = SOCKET_LIST[i];
            if(socket.huone == 'tictactoelobby'){
              socket.emit('message', {
                users: users
              });
            }
          }
        }, 500)

        //funktio jolla katsotaan voittoko jompikumpi
        function checkWinner(s){
          //vaakarivit
          if(s[0] == s[1] && s[1] == s[2]){
            return true;
          }
          if(s[3] == s[4] && s[4] == s[5]){
            return true;
          }
          if(s[6] == s[7] && s[7] == s[8]){
            return true;
          }
          //pystyrivit
          if(s[0] == s[3] && s[3] == s[6]){
            return true;
          }
          if(s[1] == s[4] && s[4] == s[7]){
            return true;
          }
          if(s[2] == s[5] && s[5] == s[8]){
            return true;
          }
          //vinottain
          if(s[0] == s[4] && s[4] == s[8]){
            return true;
          }
          if(s[2] == s[4] && s[4] == s[6]){
            return true;
          }
          return false;
        }

        //funktio jolla voidaan updateta clientien gameroom list
        function updateGamerooms(){
          const rooms = [];
          for(let i in TICTACTOEGAMEROOM_LIST){
            let gameroom = TICTACTOEGAMEROOM_LIST[i];
            if(gameroom.playing == false){
              rooms.push(gameroom);
            }
          }
          for(let i in SOCKET_LIST){
            let socket = SOCKET_LIST[i];
            if(socket.huone == 'tictactoelobby'){
              socket.emit('gamerooms', {
                rooms: rooms
              });
            }
          }
        }
};
