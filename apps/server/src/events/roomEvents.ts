import { Socket, Server } from "socket.io";
import { RoomsManager, GameManager } from "../managers";
import { Player, Room } from "../models";

import { ClientEvents, ServerEvents, RoomInfo } from "@repo/shared";
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

      if (!admin)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message:
            "An error occurred while creating the room, please try again.",
        });

      // Create the room and add the player
      const room: Room = roomsManager.createRoom(admin);
      socket.join(room.id);

      // Construct RoomInfo object
      
      
      const roomInfo: RoomInfo = {
        id: room.id,
        adminID: room.admin.socketId,
        players: Array.from(room.players.entries()).map(([id, p]) => ({
          id,
          username: p.name,
        })),
        topics: room.gameEngine.getTopics(),
        rounds: room.gameEngine.state.rounds,
      };
      
      
      // Emit RoomInfo to the creator only
      io.to(socket.id).emit(ServerEvents.ROOM_CREATED, { roomInfo });
    } catch (error) {
      console.log(`Error on creating room: ${error}`);
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

      if (!player || roomsManager.getRoomById(player.room?.id ?? "")?.admin.id !== player.id)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "only room admin can edit topics",
        });

      const room: Room =  player.room!;

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

  // Info events

  socket.on(
    ClientEvents.GET_ROOM_INFO,
    (roomId: string, callback: (response: any) => void) => {
      console.log("Request received for roomId:", roomId); // التأكد من الـ roomId

      try {
        const room: Room | undefined = roomsManager.getRoomById(roomId);
        if (!room) {
          return callback({ error: `Room with id ${roomId} not found` }); // إرجاع خطأ إذا لم يتم العثور على الغرفة
        }

        // جمع معلومات الغرفة
        const roomInfo = {
          id: room.id,
          admin: room.admin.name,
          players: room.players.forEach((p: Player) => ({
            id: p.id,
            username: p.name,
          })),
          topics: room.gameEngine.getTopics(),
          rounds: room.gameEngine.state.rounds,
        };

        // إرجاع المعلومات عبر callback
        callback({ data: roomInfo });
      } catch (error) {
        console.log("Error on GET_ROOM_INFO:", error);
        callback({ error: "Failed to fetch room info" }); // إرجاع خطأ إذا فشل أي جزء من العملية
      }
    }
  );
};
