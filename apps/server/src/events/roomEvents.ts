import { Socket, Server } from "socket.io";
import RoomsManager from "../managers/roomsManager";
import GameManager from "../managers/gameManager";
import Player from "../models/Player";
import Room from "../models/Room";

export const handleRoomEvents = (
  io: Server,
  socket: Socket,
  gameManager: GameManager
) => {
  const roomsManager: RoomsManager = gameManager.roomsManaer;

  socket.on("createRoom", () => {
    const admin: Player | null = gameManager.getPlayerBySocketId(socket.id);

    if (!admin) {
      // Emit an error if the admin is not found
      io.to(socket.id).emit("error", {
        message: "An error occurred while creating the room, please try again.",
      });
      return;
    }

    try {
      const room: Room = roomsManager.createRoom(admin); // Create room using RoomsManager
      socket.join(room.id); // Join the socket to the newly created room

      console.log(`Room ${room.id} created by ${admin.name}`);
      io.to(room.id).emit("roomCreated", { roomId: room.id }); // Notify all players in the room
    } catch (error) {
      console.log("Error on create room:", error);
      io.to(socket.id).emit("error", {
        message: "An error occurred while creating the room, please try again.",
      }); // Emit failure to the admin
    }
  });

  socket.on("removeRoom", (roomId: string) => {
    try {
      roomsManager.destroyRoom(roomId); // Destroy the room
      io.to(roomId).emit("roomRemoved", { roomId }); // Notify players in the room that it's removed

      console.log(`Room ${roomId} removed`);
    } catch (error) {
      console.log("Error on remove room:", error);
      io.to(socket.id).emit("error", { message: "Failed to remove room" }); // Emit failure to the socket
    }
  });

  socket.on("joinRoom", (roomId: string) => {
    try {
      // Get player by socket ID
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      // If player is not found, emit an error and return early
      if (!player) {
        io.to(socket.id).emit("error", { message: "Player not found" });
        return;
      }

      // Get the room by ID
      const room: Room | undefined = roomsManager.getRoomById(roomId);

      // If room is not found, emit an error and return early
      if (!room) {
        io.to(socket.id).emit("error", { message: `Room ${roomId} not found` });
        return;
      }

      // Proceed with player joining the room
      player.joinRoom(room);
      socket.join(roomId);
      io.to(roomId).emit("playerJoined", { playerId: socket.id });

      console.log(`Player ${socket.id} joined room ${roomId}`);
    } catch (error) {
      console.log("Error on join room:", error);
      io.to(socket.id).emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("leaveRoom", (roomId: string) => {
    try {
      // Get player by socket ID
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      // If player is not found, emit an error and return early
      if (!player) {
        io.to(socket.id).emit("error", { message: "Player not found" });
        return;
      }

      // Get the room by ID
      const room: Room | undefined = roomsManager.getRoomById(roomId);

      // If room is not found, emit an error and return early
      if (!room) {
        io.to(socket.id).emit("error", { message: `Room ${roomId} not found` });
        return;
      }

      // Proceed with player leaving the room
      player.leaveRoom();
      socket.leave(roomId);
      io.to(roomId).emit("playerLeft", { playerId: socket.id });

      console.log(`Player ${socket.id} left room ${roomId}`);
    } catch (error) {
      console.log("Error on leave room:", error);
      io.to(socket.id).emit("error", { message: "Failed to leave room" });
    }
  });
};
