import { Socket, Server } from "socket.io";
import { RoomsManager, GameManager } from "../managers/index.js";
import { Player, Room } from "../models/index.js";

import {
  ClientEvents,
  ServerEvents,
  RoomInfo,
  ServerErrorType,
  SERVER_ERROR_MESSAGES,
  SERVER_MESSAGES,
} from "@repo/shared/dist/index.js";
import { Topic, TopicCategory } from "@repo/game-core";

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

      if (!admin) {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          type: ServerErrorType.PLAYER_NOT_FOUND,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
        });
        return;
      }

      // Create the room and add the player
      const room: Room = roomsManager.createRoom(admin);
      socket.join(room.id);

      // Construct RoomInfo object
      const roomInfo: RoomInfo = {
        id: room.id,
        adminID: room.admin.id,
        players: room.gameEngine.state.players,
        topics: room.gameEngine.getTopics(),
        rounds: room.gameEngine.state.rounds,
      };

      io.to(socket.id).emit(ServerEvents.ROOM_CREATED, {
        roomInfo,
        playerID: admin.id,
      });
      
    } catch (error) {
      console.log("error", error);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        type: ServerErrorType.GENERAL_ERROR,
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      });
    }
  });

  // Join leave room events

  socket.on(
    ClientEvents.JOIN_ROOM,
    (roomID: string, callback?: (response: any) => void) => {
      try {
        let player: Player | null;
        let room: Room | null;

        try {
          player = gameManager.getPlayerBySocketId(socket.id);
        } catch (err) {
          const errorPayload = {
            type: ServerErrorType.PLAYER_NOT_FOUND,
            message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
          };
          if (callback) callback({ success: false, error: errorPayload });
          return;
        }

        try {
          room = roomsManager.getRoomById(roomID);
        } catch (err) {
          const errorPayload = {
            type: ServerErrorType.ROOM_NOT_FOUND,
            message: SERVER_ERROR_MESSAGES[ServerErrorType.ROOM_NOT_FOUND],
          };
          if (callback) callback({ success: false, error: errorPayload });
          return;
        }

        // Check for duplicate username
        let nameChanged = false;
        let originalName = player!.name;
        let newName = originalName;

        while (
          Array.from(room!.players.values()).some((p) => p.name === newName)
        ) {
          newName = `${originalName}_${player?.id}`;
          nameChanged = true;
        }

        if (nameChanged) {
          player!.name = newName;
        }

        player?.joinRoom(room);
        socket.join(roomID);

        // Construct RoomInfo object
        const roomInfo: RoomInfo = {
          id: room.id,
          adminID: room.admin.socketId,
          players: room.gameEngine.state.players,
          topics: room.gameEngine.getTopics(),
          rounds: room.gameEngine.state.rounds,
        };

        // Notify other players in the room about the new player
        io.to(roomID).emit(ServerEvents.PLAYER_JOINED, {
          player: { id: player?.id, username: player?.name },
        });

        if (callback)
          callback({
            success: true,
            roomInfo,
            playerID: player?.id,
            nameChanged: nameChanged
              ? `بسبب وجود لاعب ب اسم ${originalName} في الغرفة في الفعل سيتم تغير اسمك الى ${newName}`
              : null,
          });
      } catch (error) {
        console.error("Error on join room:", error);
        const errorPayload = {
          type: ServerErrorType.GENERAL_ERROR,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
        };
        if (callback) callback({ success: false, error: errorPayload });
      }
    }
  );

  socket.on(ClientEvents.LEAVE_ROOM, (callback?: (response: any) => void) => {
    try {
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      if (!player) {
        const errorPayload = {
          type: ServerErrorType.PLAYER_NOT_FOUND,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
        };
        if (callback) callback({ success: false, error: errorPayload });
        return;
      }

      if (!player.room) {
        const errorPayload = {
          type: ServerErrorType.PLAYER_NOT_IN_ROOM,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_IN_ROOM],
        };
        if (callback) callback({ success: false, error: errorPayload });
        return;
      }

      const roomID: string = player.room.id;

      // Check if the leaving player is the admin
      if (player.room.admin.id === player.id) {
        // Destroy the room and notify all players
        roomsManager.destroyRoom(roomID);
        io.to(roomID).emit(ServerEvents.ROOM_DESTROYED, {
          roomId: roomID,
          message: SERVER_MESSAGES.ROOM_DESTROYED_BY_ADMIN,
        });
        if (callback)
          callback({
            success: true,
            message: SERVER_MESSAGES.ROOM_DESTROYED_BY_ADMIN,
          });
        return;
      }

      // Proceed with normal player leaving the room
      socket.leave(roomID);
      player.leaveRoom();

      io.to(roomID).emit(ServerEvents.PLAYER_LEFT, player.id);

      if (callback) callback({ success: true });
    } catch (error) {
      console.error("Error on leave room:", error);
      const errorPayload = {
        type: ServerErrorType.GENERAL_ERROR,
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      };
      if (callback) callback({ success: false, error: errorPayload });
    }
  });

  socket.on(ClientEvents.KICK_PLAYER, (playerID: string, callback?: (response: any) => void) => {
    try {      
      const admin: Player | null = gameManager.getPlayerBySocketId(socket.id);
      
      if (!admin || !admin.room || admin.room.admin.id !== admin.id) {
        const errorPayload = {
          type: ServerErrorType.NOT_ADMIN,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.NOT_ADMIN]
        };
        if (callback) callback({ success: false, error: errorPayload });
        return;
      }
  
      const room = admin.room;
      const playerToKick = room.players.find(p => p.id === playerID);
  
      if (!playerToKick) {
        const errorPayload = {
          type: ServerErrorType.PLAYER_NOT_FOUND,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND]
        };
        if (callback) callback({ success: false, error: errorPayload });
        return;
      }
  
      // Notify the kicked player
      io.to(playerToKick.socketId).emit(ServerEvents.KICKED_FROM_ROOM, {
        message: "تم طردك من الغرفة من قبل المشرف"
      });
  
      // Remove player from room
      const kickedPlayerSocket = io.sockets.sockets.get(playerToKick.socketId);
      if (kickedPlayerSocket) {
        kickedPlayerSocket.leave(room.id);
      }
      playerToKick.leaveRoom();
  
      // Notify other players in the room
      io.to(room.id).emit(ServerEvents.PLAYER_LEFT, playerID);
  
      if (callback) callback({ success: true });
    } catch (error) {
      console.error("Error on kick player:", error);
      const errorPayload = {
        type: ServerErrorType.GENERAL_ERROR,
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR]
      };
      if (callback) callback({ success: false, error: errorPayload });
    }
  });


  // Topics Events

  socket.on(ClientEvents.ADD_TOPIC, (newTopic: Omit<Topic, "id">) => {
    try {
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      if (
        !player ||
        roomsManager.getRoomById(player.room?.id ?? "")?.admin.id !== player.id
      ) {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          type: ServerErrorType.NOT_ADMIN,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.NOT_ADMIN],
        });
        return;
      }

      const room: Room = player.room!;

      if (room.gameEngine.state.phase !== "lobby") {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          type: ServerErrorType.INVALID_PHASE,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.INVALID_PHASE],
        });
        return;
      }

      room.gameEngine.addTopic(newTopic);

      io.to(room.id).emit(ServerEvents.TOPICS_UPDATED, {
        topics: room.gameEngine.getTopics(),
      });
    } catch (error) {
      console.log("error", error);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        type: ServerErrorType.GENERAL_ERROR,
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      });
    }
  });

  socket.on(ClientEvents.REMOVE_TOPIC, (topicID: string) => {
    try {
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      if (!player || player.room?.admin.id !== player.id) {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          type: ServerErrorType.NOT_ADMIN,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.NOT_ADMIN],
        });
        return;
      }

      const room: Room = player.room;

      if (room.gameEngine.state.phase !== "lobby") {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          type: ServerErrorType.INVALID_PHASE,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.INVALID_PHASE],
        });
        return;
      }

      room.gameEngine.removeTopic(topicID);

      io.to(room.id).emit(ServerEvents.TOPICS_UPDATED, {
        topics: room.gameEngine.getTopics(),
      });
    } catch (error) {
      console.log("error", error);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        type: ServerErrorType.GENERAL_ERROR,
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      });
    }
  });

  socket.on(ClientEvents.UPDATE_TOPIC, (newTopic: Topic) => {
    try {
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      if (!player || player.room?.admin.id !== player.id) {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          type: ServerErrorType.NOT_ADMIN,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.NOT_ADMIN],
        });
        return;
      }

      const room: Room = player.room;

      if (room.gameEngine.state.phase !== "lobby") {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          type: ServerErrorType.INVALID_PHASE,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.INVALID_PHASE],
        });
        return;
      }

      room.gameEngine.updateTopic(newTopic);

      io.to(room.id).emit(ServerEvents.TOPICS_UPDATED, {
        topics: room.gameEngine.getTopics(),
      });
    } catch (error) {
      console.log("error", error);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        type: ServerErrorType.GENERAL_ERROR,
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      });
    }
  });

  socket.on(ClientEvents.UPDATE_TOPIC_CATEGORY, (category: TopicCategory) => {
    try {
      const player: Player | null = gameManager.getPlayerBySocketId(socket.id);

      if (!player || player.room?.admin.id !== player.id) {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          type: ServerErrorType.NOT_ADMIN,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.NOT_ADMIN],
        });
        return;
      }

      const room: Room = player.room;

      if (room.gameEngine.state.phase !== "lobby") {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          type: ServerErrorType.INVALID_PHASE,
          message: SERVER_ERROR_MESSAGES[ServerErrorType.INVALID_PHASE],
        });
        return;
      }

      room.gameEngine.selectCategory(category);

      io.to(room.id).emit(ServerEvents.TOPIC_CATEGORY_UPDATED, {
        category,
      });
    } catch (error) {
      console.log("error", error);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        type: ServerErrorType.GENERAL_ERROR,
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      });
    }
  });
};


