const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

// ***** whenever socket.io gets a new connection
io.on('connection', (socket) => {
  console.log('New WebSocket Connection');

  // io.emit, socket.broadcast.emit --> send to all connections
  // io.to.emit, socket.broadcast.to.emit --> send to connections in a specific room

  // ! RECEIVING NAME AND ROOM FROM A CLIENT
  socket.on('join', ({ username, room }, callback) => {
    // add user
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }

    // allows joining/access to a specific room
    socket.join(user.room);

    // todo--- SENDING WELCOME TEXT TO NEW USERS
    socket.emit(
      'message',
      generateMessage(`Admin Bot 🤖`, `Hey there champ! 😉`)
    );

    // todo--- SENDING NEW USER ALERT TO OTHER USERS
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage(`${user.username} just slid into the chat! 🚀`)
      );

    // todo--- SENDING ROOM DATA TO THE CHAT ROOM
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  // todo--- RECEIVING MESSAGE FROM ONE CLIENT
  socket.on('sendMessage', (message, callback) => {
    // check for foul language
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed');
    }

    // get user
    const user = getUser(socket.id);

    // * SENDING MESSAGE TO CHAT ROOM
    io.to(user.room).emit('message', generateMessage(user.username, message));

    // call the acknowledgement func from the client code
    callback();
  });

  // todo--- RECEIVING LOCATION FROM ONE CLIENT
  socket.on('sendLocation', ({ latitude, longitude }, callback) => {
    // get user
    const user = getUser(socket.id);

    // * SENDING LOCATION TO CHAT ROOM
    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${latitude},${longitude}`
      )
    );

    // acknowledge sender
    callback();
  });

  // todo--- WHEN A USER LEAVES THE CHAT
  socket.on('disconnect', () => {
    // remove user
    const user = removeUser(socket.id);

    if (user) {
      // *  SENDING `USER LEFT` ALERT TO CHAT ROOM
      io.to(user.room).emit(
        'message',
        generateMessage(`${user.username} just vanished from the chat! 🏃‍♂️`)
      );

      // * SENDING ROOM DATA TO THE CHAT ROOM
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => console.log(`Server is listening at port ${port}.`));
