import express from "express";
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./socket";

import "./config/environment"; // Ensure this module is properly typed

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

setupSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("🔁 Gracefully shutting down");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("🛑 Server interrupted and closed");
    process.exit(0);
  });
});
