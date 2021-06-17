const users = [];

//todo- addUser FUNCTION
const addUser = ({ id, username, room }) => {
  // validate the data
  if (!username || !room) {
    return {
      error: 'Username and Room are required!',
    };
  }

  // clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // check for existing user
  const existingUser = users.find(
    (user) => user.room === room && user.username === username
  );

  // validate username
  if (existingUser) {
    return {
      error: 'Username already exists!',
    };
  }

  // store user
  const user = { id, username, room };
  users.push(user);
  return { user };
};

//todo- removeUser FUNCTION
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

//todo- getUser FUNCTION
const getUser = (id) => {
  const user = users.find((user) => user.id === id);
  return user;
};

//todo- getUsersInRoom FUNCTION
const getUsersInRoom = (room) => {
  const newUsers = users.filter((user) => user.room === room);
  return newUsers;
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
