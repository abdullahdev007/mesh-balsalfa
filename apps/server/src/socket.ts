import { Server, Socket } from "socket.io";
import { GameManager } from "./managers";
import { handleRoomEvents } from "./events/roomEvents";
import { handleRoundEvents } from "./events/roundEvents";
import { ClientEvents, ServerEvents } from "@repo/shared";

export const setupSocket = (io: Server) => {
  // Explicitly define io as Server
  const gameManager: GameManager = new GameManager();

  io.on("connection", (socket: Socket) => {
    // Explicitly define socket as Socket
    const username = socket.handshake.query.username as string | undefined;

    gameManager.addPlayer(socket.id, username || "Guest");


    handleRoomEvents(io, socket, gameManager);
    handleRoundEvents(io, socket, gameManager);

    // Handle username update
    socket.on(ClientEvents.UPDATE_USERNAME, ({ username: newUsername }) => {
      const player = gameManager.getPlayerBySocketId(socket.id);
      
      if (player) {
        player.name = newUsername;
        socket.handshake.query.username = newUsername;
        io.to(socket.id).emit(ServerEvents.USERNAME_UPDATED, {
          username: newUsername,
        });
      }
    });

    socket.on("disconnect", () => {
      gameManager.removePlayer(socket.id);
    });
  });
};
