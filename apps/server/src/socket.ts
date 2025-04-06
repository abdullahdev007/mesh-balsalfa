import { Server, Socket } from "socket.io";
import { GameManager } from "./managers";
import { handleRoomEvents } from "./events/roomEvents";
import { handleRoundEvents } from "./events/roundEvents";

export const setupSocket = (io: Server) => {  // Explicitly define io as Server
    const gameManager: GameManager = new GameManager();

    io.on("connection", (socket: Socket) => {  // Explicitly define socket as Socket
        const username = socket.handshake.query.username as string | undefined;

        gameManager.addPlayer(socket.id, username || "Guest");

        console.log("player joined :", username);
        
        handleRoomEvents(io,socket , gameManager);
        handleRoundEvents(io,socket,gameManager);

        socket.on("disconnect", () => {
            console.log("player leaveed :",username);
            gameManager.removePlayer(socket.id);
            
        });
    });
};
