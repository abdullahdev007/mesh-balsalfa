import { Server, Socket } from "socket.io";
import { GameManager, RoundManager } from "../managers/index.js";
import { Player, Room } from "../models/index.js";
import {
  ClientEvents,
  ServerEvents,
  ServerErrorType,
  SERVER_ERROR_MESSAGES,
  SERVER_MESSAGES,
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
        io.to(room.id).emit(ServerEvents.PHASE_CHANGED, phase);
      });

      room.gameEngine.on(GameEvent.ROUND_ENDED, (round: Round) => {
        io.to(room.id).emit(ServerEvents.ROUND_ENDED, round);
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

      if (readyCount < room.players.size) {
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
      } else if (readyCount === room.players.size) {
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
      io.to(room.id).emit(ServerEvents.QUESTION_ASKED, question );
      return callback({ success: true });
      
    } catch (error) {
      console.log(`Error on QUESTION_ASK_DONE event : ${error}`);
      callback({
        success: false,
        error: {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
        },
      });
    }
  });

  socket.on(ClientEvents.ASK_FREE_QUESTION, (targetPlayerID: string) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;
      if (!player || !room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
        });

      if (room.gameEngine.state.phase !== "free-questions-phase")
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.INVALID_ROUND_PHASE],
        });

      const question: Question = room.gameEngine.askFreeQuestion(
        player.id,
        targetPlayerID
      )!;
      io.to(room.id).emit(ServerEvents.FREE_QUESTION_ASKED, { question });
    } catch (error) {
      console.log(`Error on  ASK_FREE_QUESTION event : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      });
    }
  });

  socket.on(ClientEvents.FREE_QUESTION_ASK_DONE, () => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;
      if (!player || !room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
        });

      io.to(room.id).emit(ServerEvents.FREE_QUESTION_ASK_DONE);
    } catch (error) {
      console.log(`Error on  FREE_QUESTION_ASK_DONE event : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      });
    }
  });

  socket.on(ClientEvents.START_VOTING, () => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room) {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
        });
        return;
      }

      if (!room.gameEngine.canStartVoting(player.id)) {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.NOT_ADMIN],
        });
        return;
      }

      room.gameEngine.startVoting();
    } catch (error) {
      console.log(`Error on START_VOTING event : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      });
    }
  });

  socket.on(ClientEvents.CAST_VOTE, (suspectID: string) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room) {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
        });
        return;
      }

      if (room.gameEngine.state.phase !== "voting") {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.CANNOT_VOTE],
        });
        return;
      }

      room.gameEngine.castVote(player.id, suspectID);
    } catch (error) {
      console.log(`Error on CAST_VOTE event : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      });
    }
  });

  socket.on(ClientEvents.GUESS_TOPIC, (topicID: string) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room) {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.PLAYER_NOT_FOUND],
        });
        return;
      }

      if (
        room.gameEngine.getCurrentRound?.spy.id !== player.id &&
        room.gameEngine.state.phase !== "guess-topic"
      ) {
        io.to(socket.id).emit(ServerEvents.ERROR, {
          message: SERVER_ERROR_MESSAGES[ServerErrorType.CANNOT_GUESS_TOPIC],
        });
        return;
      }

      room.gameEngine.guessTopic(topicID, player.id);
      io.to(room.id).emit(ServerEvents.TOPIC_GUESSED, {});
    } catch (error) {
      console.log(`Error on GUESS_TOPIC event: ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: SERVER_ERROR_MESSAGES[ServerErrorType.GENERAL_ERROR],
      });
    }
  });
};
