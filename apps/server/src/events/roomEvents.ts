import { Socket, Server } from "socket.io";
import { RoomsManager, GameManager } from "../managers";
import { Player, Room } from "../models";

import { ClientEvents, ServerEvents } from "@repo/socket-events";
import { TopicCategory } from "@repo/game-core";

export const handleRoomEvents = (
  io: Server,
  socket: Socket,
  gameManager: GameManager
) => {
  const roomsManager: RoomsManager = gameManager.roomsManager;


  // Create Destroy events

  socket.on(ClientEvents.CREATE_ROOM, () => {
    try {
      const admin: Player | null = gameManager.getPlayerBySocketId(socket.id);

      // Emit an error if the admin is not found
      if (!admin)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message:
            "An error occurred while creating the room, please try again.",
        });

      // create room and add player to room
      const room: Room = roomsManager.createRoom(admin);
      socket.join(room.id);

      io.to(room.id).emit(ServerEvents.ROOM_CREATED, { roomId: room.id }); // Notify all players in the room
    } catch (error) {
      console.log(`Error on createing room : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "An error occurred while creating the room, please try again.",
      });
    }
  });

  socket.on(ClientEvents.DESTROY_ROOM, (roomId: string) => {
    try {
      const room: Room = roomsManager.getRoomById(roomId)!;

      // if room not found return error
      if (room == undefined)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "the room not found, please try again",
        });

      //if is not admin user return permmision error
      if (!room.admin.isMatchingSocket(socket.id))
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "You do not have the authority to destroy this room.",
        });

      // destroy room and notify room players
      roomsManager.destroyRoom(roomId);
      io.to(roomId).emit(ServerEvents.ROOM_DESTROYED, { roomId });
    } catch (error) {
      console.log("Error on destroy room:", error);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "Failed to destryo room, please try again",
      });
    }
  });


  // Join leave room events
  
  socket.on(ClientEvents.JOIN_ROOM, (roomId: string) => {
    try {
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      // If player is not found, emit an error and return early
      if (!player)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again.",
        });

      const room: Room | undefined = roomsManager.getRoomById(roomId);

      // If room is not found, emit an error and return early
      if (!room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: `Room  with id : ${roomId} not found`,
        });

      // Proceed with player joining the room
      player.joinRoom(room);
      socket.join(roomId);
      io.to(roomId).emit(ServerEvents.ROOM_JOINED, { player });
    } catch (error) {
      console.log("Error on join to room :", error);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "something write wrong Please try again.m",
      });
    }
  });

  socket.on(ClientEvents.LEAVE_ROOM, (roomId: string) => {
    try {
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      // If player is not found, emit an error and return early
      if (!player)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again.",
        });

      const room: Room | undefined = roomsManager.getRoomById(roomId);

      // If room is not found, emit an error and return early
      if (!room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: `Room with id : ${roomId}, not found`,
        });

      // Proceed with player leaving the room
      player.leaveRoom();
      socket.leave(roomId);
      io.to(roomId).emit(ServerEvents.ROOM_LEFT, { player });
    } catch (error) {
      console.log("Error on leave room :", error);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message:
          "Failed to leave room, something write wrong Please try again.",
      });
    }
  });

  // Topics Events

  socket.on(ClientEvents.ADD_TOPIC, (name: string, category: TopicCategory) => {
    try {
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      if (!player || player.room?.admin.id !== player.id)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "only room admin can edit topics",
        });

      const room: Room = player.room;

      if (room.gameEngine.state.phase !== "lobby")
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "Edit topics are only available in the lobby",
        });

      room.gameEngine.addTopic({ name, category });

      io.to(room.id).emit(ServerEvents.TOPICS_UPDATED, {
        topics: room.gameEngine.getTopics(),
      });
    } catch (error) {
      console.log("Error on add a topic ", error);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "something write wrong Please try again.",
      });
    }
  });

  socket.on(ClientEvents.REMOVE_TOPIC, (topicID: string) => {
    try {
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      if (!player || player.room?.admin.id !== player.id)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "only room admin can edit topics",
        });

      const room: Room = player.room;

      if (room.gameEngine.state.phase !== "lobby")
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "Edit topics are only available in the lobby",
        });

      room.gameEngine.removeTopic(topicID);

      io.to(room.id).emit(ServerEvents.TOPICS_UPDATED, {
        topics: room.gameEngine.getTopics(),
      });
    } catch (error) {
      console.log("Error on add a topic ", error);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "something write wrong Please try again.",
      });
    }
  });
};
