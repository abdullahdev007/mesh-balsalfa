import express from "express";
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./socket.js";

import "./config/environment.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

setupSocket(io);

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

function shutdown() {
  console.log("[SERVER] Shutting down...");
  io.close(); // <-- IMPORTANT
  server.close(() => {
    console.log("[SERVER] Closed");
    setTimeout(() => process.exit(0), 500); // Delay to release port
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
