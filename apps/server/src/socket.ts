import { Server, Socket } from "socket.io";
import { GameManager } from "./managers/index.js";
import { handleRoomEvents } from "./events/roomEvents.js";
import { handleRoundEvents } from "./events/roundEvents.js";
import { Player, Room } from "./models/index.js";
import {
  ClientEvents,
  SERVER_MESSAGES,
  ServerEvents,
} from "@repo/shared/dist/index.js";
import { GamePhase } from "@repo/game-core";

export const setupSocket = (io: Server) => {
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
      gameManager.players.find((player: Player) => {
        if (player.isMatchingSocket(socket.id)) {
          if (player?.room) {
            const room: Room = player.room;
            const roomPhase: GamePhase = room.gameEngine.state.phase;
            const isAdmin: boolean = room.admin.socketId === socket.id;

            if (isAdmin) {
              player.leaveRoom();

              io.to(room.id).emit(ServerEvents.ROOM_DESTROYED, {
                roomId: room.id,
                message: SERVER_MESSAGES.ROOM_DESTROYED_BY_ADMIN,
              });
            } else if (roomPhase !== "lobby") {
              room.gameEngine.destroyRound();
              const message: string =
                SERVER_MESSAGES.ROUND_ENDED_BECAUSE_PLAYER_LEFT;
              player.leaveRoom();
              io.to(room.id).emit(ServerEvents.ROUND_DESTROYED, message);
              io.to(room.id).emit(ServerEvents.PLAYER_LEFT, player.id);
            } else {
              io.to(room.id).emit(ServerEvents.PLAYER_LEFT, player.id);
            }
          }
        }
      });

      gameManager.removePlayer(socket.id);
    });
  });
};
