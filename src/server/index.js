const serve = require("koa-static-server");
const koa = require("koa");
const app = new koa();
const http = require("http");
const readline = require("readline");

stack = [];

app.use(serve({ rootDir: "../../dist" }));

app.use(async (next) => {
  if (this.path !== "/") {
    return await next();
  }
});

const server = http.createServer(app.callback());

const io = require("socket.io")(server);
//initializing variables
let activeroom = null;
let usernames = [];

//forming connections and sockets
io.on("connection", function (socket) {
  socket.on("login", function ({ username, room }) {
    stack.push(socket);
    console.log(`[Server] login: ${username + " -> " + room}`);
    usernames.push(username);
    socket.join(room);
    activeroom = Object.keys(socket.rooms).slice(1);
    socket.username = username;
    socket.emit("users.login", { username, room });
  });

  //when a message is formed, the web socket is sent
  socket.on("message", ({ text }) => {
    activeroom = Object.keys(socket.rooms).slice(1);
    console.log(`[Server] message: ${text}` + ` -> room: ${activeroom}`);
    const message = {
      text,
      username: socket.username,
      room: activeroom
    };
    io.to(activeroom).emit("messages.new", { message });
  });

  //user logout
  socket.on("logout", ({ username }) => {
    if (username) {
      console.log(`[Server] logout: ${username}`);
      usernames = usernames.filter((u) => u !== username);
      io.to(activeroom).emit("users.logout", { username });
      socket.leave(activeroom);
    }
  });

  //disconnects server
  socket.on("disconnect", ({ username }) => {
    console.log(`[Server] disconnected: ${socket.id} disconnect!`);

    const i = usernames.indexOf(username);
    usernames.splice(i, 1);
    socket.disconnect(true);
  });

  //finds all the rooms in the bot
  function findRooms() {
    let openRooms = [];
    const rooms = io.sockets.adapter.rooms;
    const sockets = io.sockets.sockets;
    if (rooms) {
      for (const room in rooms) {
        if (!sockets[room]) {
          openRooms.push({
            name: room,
            counts: io.sockets.adapter.rooms[room].length
          });
        }
      }
    }
    return openRooms;
  }

  //returns the list of rooms
  socket.on("rooms", function () {
    const rooms = findRooms();
    io.emit("rooms.list", { rooms: rooms });
  });
});

//function for api for closing server
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}
//variable for port
const port = 80;

//where the server is listening for the port
server.listen(port, async () => {
  console.log(`listening on port ${port}`);

  const ans = await askQuestion("Press Enter to close server");
  //loop for disconnecting server
  while (stack.length) {
    var s = stack.pop();
    console.log("Disconnecting: " + s.id);
    s.disconnect(true);
  }

  console.log("Closing Server");
  process.exit();
});
