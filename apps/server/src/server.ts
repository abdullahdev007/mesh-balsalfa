import express from "express";
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./socket";

import "./config/environment"; // Ensure this module is properly typed

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

setupSocket(io);

const PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
