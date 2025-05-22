import { Server, Socket } from "socket.io";
import { GameManager, RoundManager } from "../managers/index.js";
import { Player, Room } from "../models/index.js";
import {
  ClientEvents,
  ServerEvents,
  ServerErrorType,
  SERVER_ERROR_MESSAGES,
  SERVER_MESSAGES,
  RoomInfo,
} from "@repo/shared/dist/index.js";
import { GameEvent, GamePhase, Question, Round } from "@repo/game-core";

export const handleRoundEvents = (
  io: Server,
  socket: Socket,
  gameManager: GameManager
) => {
  socket.on(ClientEvents.START_ROUND, (callback) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;

      if (!player) {
        callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
          },
        });
        return;
      }

      const room: Room = player.room!;

      if (!room) {
        callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.ROOM_NOT_FOUND],
          },
        });
        return;
      }

      if (room.gameEngine.state.phase !== "lobby") {
        callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.INVALID_ROUND_PHASE],
          },
        });
        return;
      }

      if (room.gameEngine.state.players.length < 3) {
        callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.NOT_ENOUGH_PLAYERS],
          },
        });
        return;
      }

      if (!room.admin.isMatchingSocket(socket.id)) {
        callback({
          success: false,
          error: { message: SERVER_ERROR_MESSAGES[ServerErrorType.NOT_ADMIN] },
        });
        return;
      }

      // reset round manager
      if (room.roundManager) {
        room.roundManager.removeAllListeners();
        room.roundManager = new RoundManager(room);
      }

      room.gameEngine.startNewRound();

      // reset gameEngine events
      room.gameEngine.removeAllListeners();

      room.gameEngine.on(GameEvent.PHASE_CHANGED, (phase: GamePhase) => {
        console.log("phase changed :", phase);
        
        io.to(room.id).emit(ServerEvents.PHASE_CHANGED, {
          phase,
          currentRound: room.gameEngine.getCurrentRound,
        });
      });

      io.to(room.id).emit(
        ServerEvents.ROUND_STARTED,
        room.gameEngine.getCurrentRound
      );

      callback({ success: true });
    } catch (error) {
      console.log(`Error on starting round : ${error}`);
      callback({
        success: false,
        error: {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
        },
      });
    }
  });

  socket.on(ClientEvents.ROLE_TAKED, (callback) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
          },
        });

      const timerComplete = () => {
        const message: string = SERVER_MESSAGES.ROLE_ASSIGN_COMPLETED;
        io.to(room.id).emit(
          ServerEvents.ROLE_ASSIGN_COUNTDOWN_COMPLETE,
          message
        );

        room.gameEngine.startQuestionPhase()!;
      };

      const roundManager = room.roundManager;

      const timerId = `role_assignment_${room.id}`;

      roundManager.addToWaitingList(player.id, timerId);

      const readyCount = roundManager.getReadyCount(timerId);

      if (readyCount < room.players.length) {
        callback({
          success: true,
          message: SERVER_MESSAGES.ROLE_ASSIGN_WAITING_PLAYERS,
        });
      }

      if (readyCount == 1) {
        const message: string = SERVER_MESSAGES.ROLE_ASSIGN_TIMER_STARTED;
        io.to(room.id).emit(
          ServerEvents.ROLE_ASSIGN_COUNTDOWN_STARTED,
          message
        );

        // Start countdown
        roundManager.startCountdown(timerId, {
          duration: 35000,
          onExpire: () => timerComplete(),
        });
      } else if (readyCount === room.players.length) {
        roundManager.cancelCountdown(timerId);
        timerComplete();
      }
    } catch (error) {
      console.log(`Error on ROLE_TAKED event : ${error}`);
      callback({
        success: false,
        error: {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
        },
      });
    }
  });

  socket.on(ClientEvents.ASK_NEXT_QUESTION, (callback) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
          },
        });

      if (room.gameEngine.state.phase !== "questions-phase")
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.INVALID_ROUND_PHASE],
          },
        });

      const question: Question = room.gameEngine.askNextQuestion()!;
      io.to(room.id).emit(ServerEvents.QUESTION_ASKED, question);
      return callback({ success: true });
    } catch (error) {
      console.log(`Error on QUESTION_ASK_DONE event : ${error}`);

      return callback({
        success: false,
        error: {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
        },
      });
    }
  });

  socket.on(
    ClientEvents.ASK_FREE_QUESTION,
    (targetPlayerID: string, callback) => {
      try {
        const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
        const room: Room = player.room!;

        console.log(targetPlayerID);

        if (!player || !room)
          return callback({
            success: false,
            error: {
              message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
            },
          });

        if (room.gameEngine.state.phase !== "free-questions-phase")
          return callback({
            success: false,
            error: {
              message:
                SERVER_ERROR_MESSAGES[ServerErrorType.INVALID_ROUND_PHASE],
            },
          });

        const question: Question = room.gameEngine.askFreeQuestion(
          player.id,
          targetPlayerID
        )!;

        io.to(room.id).emit(ServerEvents.FREE_QUESTION_ASKED, question);
        return callback({ success: true });
      } catch (error) {
        console.log(`Error on  ASK_FREE_QUESTION event : ${error}`);
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
          },
        });
      }
    }
  );

  socket.on(
    ClientEvents.FREE_QUESTION_ASK_DONE,
    (nextAskerID: string, callback) => {
      try {
        const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
        const room: Room = player.room!;

        if (!player || !room)
          return callback({
            success: false,
            error: {
              message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
            },
          });

        io.to(room.id).emit(ServerEvents.FREE_QUESTION_ASK_DONE, nextAskerID);
        return callback({ success: true });
      } catch (error) {
        console.log(`Error on  FREE_QUESTION_ASK_DONE event : ${error}`);
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
          },
        });
      }
    }
  );

  socket.on(ClientEvents.START_VOTING, (callback) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
          },
        });

      room.gameEngine.startVoting();
    } catch (error) {
      console.log(`Error on START_VOTING event : ${error}`);
      return callback({
        success: false,
        error: {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
        },
      });
    }
  });

  socket.on(ClientEvents.CAST_VOTE, (suspectID: string, callback) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
          },
        });

      if (room.gameEngine.state.phase !== "voting")
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.CANNOT_VOTE],
          },
        });

      console.log(room.gameEngine.state.phase);

      room.gameEngine.castVote(player.id, suspectID);

      const roundManager = room.roundManager;
      const timerId = `voting_${room.id}`;

      roundManager.addToWaitingList(player.id, timerId);
      const votedCount = roundManager.getReadyCount(timerId);

      if (votedCount < room.players.length) {
        callback({
          success: true,
          message: SERVER_MESSAGES.VOTING_WAITING_PLAYERS,
        });
      }

      if (votedCount === 1) {
        const message = SERVER_MESSAGES.VOTING_COUNTDOWN_STARTED;
        io.to(room.id).emit(ServerEvents.VOTING_COUNTDOWN_STARTED, message);

        roundManager.startCountdown(timerId, {
          duration: 30000,
          onExpire: () => {
            // Get players who haven't voted yet
            const votedPlayers = roundManager.getWaitingList(timerId);
            const nonVotedPlayers = Array.from(room.players.values()).filter(
              (player) => !votedPlayers.has(player.id)
            );

            // Make non-voted players vote for themselves
            nonVotedPlayers.forEach((player) => {
              room.gameEngine.castVote(player.id, player.id);
            });

            const message = SERVER_MESSAGES.VOTING_COUNTDOWN_COMPLETED;
            io.to(room.id).emit(
              ServerEvents.VOTING_COUNTDOWN_COMPLETE,
              message
            );
          },
        });
      } else if (votedCount === room.players.length) {
        roundManager.cancelCountdown(timerId);
        const message = SERVER_MESSAGES.VOTING_COUNTDOWN_COMPLETED;
        io.to(room.id).emit(ServerEvents.VOTING_COUNTDOWN_COMPLETE, message);
      }
    } catch (error) {
      console.log(`Error on CAST_VOTE event : ${error}`);
      return callback({
        success: false,
        error: {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
        },
      });
    }
  });

  socket.on(ClientEvents.START_GUESS_TOPIC, (callback) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
          },
        });

      if (room.gameEngine.state.phase !== "show-spy")
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.INVALID_ROUND_PHASE],
          },
        });

      room.gameEngine.startGuessTopic();
      return callback({ success: true });
    } catch (error) {
      console.log(`Error on START_GUESS_TOPIC event : ${error}`);
      return callback({
        success: false,
        error: {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
        },
      });
    }
  });

  socket.on(ClientEvents.GUESS_TOPIC, (topicID: string, callback) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
          },
        });

      if (
        room.gameEngine.getCurrentRound?.spy.id !== player.id ||
        room.gameEngine.state.phase !== "guess-topic"
      ) {
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.CANNOT_GUESS_TOPIC],
          },
        });
      }

      room.gameEngine.guessTopic(topicID, player.id);
      io.to(room.id).emit(
        ServerEvents.TOPIC_GUESSED,
        room.gameEngine.getCurrentRound
      );
    } catch (error) {
      console.log(`Error on GUESS_TOPIC event : ${error}`);
      return callback({
        success: false,
        error: {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
        },
      });
    }
  });

  socket.on(ClientEvents.END_ROUND, (callback) => {
    try {
      console.log("end round in room");

      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
          },
        });

      if (room.gameEngine.state.phase !== "guess-topic")
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.INVALID_ROUND_PHASE],
          },
        });

      if (player.id !== room.admin.id)
        return callback({
          success: false,
          error: {
            message: SERVER_ERROR_MESSAGES[ServerErrorType.NOT_ADMIN],
          },
        });

      room.gameEngine.endRound();

      const roomInfo: RoomInfo = {
        id: room.id,
        adminID: room.admin.id,
        players: room.gameEngine.state.players,
        topics: room.gameEngine.getTopics(),
        rounds: room.gameEngine.state.rounds,
      };

      io.to(room.id).emit(ServerEvents.ROUND_ENDED, roomInfo);
      return callback({ success: true });
    } catch (error) {
      console.log(`Error on END_ROUND event : ${error}`);
      return callback({
        success: false,
        error: {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
        },
      });
    }
  });
};
