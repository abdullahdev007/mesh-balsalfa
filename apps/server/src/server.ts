const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { setupSocket } = require("./socket");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

require('./config/environment');

setupSocket(io);


const PORT = process.env.SERVER_PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

