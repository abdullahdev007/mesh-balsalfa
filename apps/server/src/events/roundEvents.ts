import { Server, Socket } from "socket.io";
import { GameManager, RoundManager } from "../managers";
import { ClientEvents, ServerEvents } from "@repo/shared";
import { Player, Room } from "../models";
import { GameEvent, GamePhase, Question, Round } from "@repo/game-core";

export const handleRoundEvents = (
  io: Server,
  socket: Socket,
  gameManager: GameManager
) => {
  socket.on(ClientEvents.START_ROUND, () => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;

      if (!player)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again.",
        });

      const room: Room = player.room!;

      if (!room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "You must be inside the room to start round.",
        });

      if (!room.admin.isMatchingSocket(socket.id))
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "You do not have the authority to start the round",
        });

      // reset round manager
      if (room.roundManager) {
        room.roundManager.removeAllListeners();
        room.roundManager = new RoundManager(room);
      }

      room.gameEngine.startNewRound();
      const round: Round = room.gameEngine.getCurrentRound!;

      // reset gameEngine events
      room.gameEngine.removeAllListeners();

      room.gameEngine.on(GameEvent.PHASE_CHANGED, (phase: GamePhase) => {
        io.to(room.id).emit(ServerEvents.PHASE_CHANGED, { phase });
      });

      room.gameEngine.on(GameEvent.ROUND_ENDED,(round: Round) => {
        io.to(room.id).emit(GameEvent.ROUND_ENDED,{ round })
      })

      io.to(room.id).emit(ServerEvents.ROUND_STARTED, {
        roundNumber: round.roundNumber,
      });
    } catch (error) {
      console.log(`Error on starting round : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "An error on starting round, please try again.",
      });
    }
  });

  socket.on(ClientEvents.TAKEED_ROLE, () => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again.",
        });

      if (!room.roundManager.checkInWaitingList(player, "role_assignment")) {
        room.roundManager.addToWaitingList(player, "role_assignment");

        if (!room.roundManager.hasTimer("role_assignment")) {
          io.to(room.id).emit(ServerEvents.COUNTDOWN_STARTED, {
            type: "role_assignment",
          });

          room.roundManager.on("role_assignment_done", () => {
            const firstAskerID: string = room.gameEngine.startQuestionPhase()!;

            const question: Question =
              room.gameEngine.askNextQuestion(firstAskerID)!;

            io.to(room.id).emit(ServerEvents.QUESTION_ASKED, { question });
          });
        }
      }
    } catch (error) {
      console.log(`Error on TAKEED_ROLE event : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "something write wrong Please try again.",
      });
    }
  });

  socket.on(ClientEvents.QUESTION_ASK_DONE, () => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;
      if (!player || !room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again.",
        });

      if (room.gameEngine.state.phase !== "questions-phase")
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again",
        });

      const question: Question = room.gameEngine.askNextQuestion(player.id)!;

      io.to(room.id).emit(ServerEvents.QUESTION_ASKED, { question });
    } catch (error) {
      console.log(`Error on  QUESTION_ASK_DONE event : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "something write wrong Please try again.",
      });
    }
  });

  socket.on(ClientEvents.ASK_FREE_QUESTION, (targetPlayerID: string) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;
      if (!player || !room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again.",
        });

      if (room.gameEngine.state.phase !== "free-questions-phase")
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "cant ask question if round phase not free questions phase",
        });

      const question: Question = room.gameEngine.askFreeQuestion(
        player.id,
        targetPlayerID
      )!;
      io.to(room.id).emit(ServerEvents.FREE_QUESTION_ASKED, { question });
    } catch (error) {
      console.log(`Error on  ASK_FREE_QUESTION event : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "something write wrong Please try again.",
      });
    }
  });

  socket.on(ClientEvents.FREE_QUESTION_ASK_DONE, () => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;
      if (!player || !room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again.",
        });

      io.to(room.id).emit(ServerEvents.FREE_QUESTION_ASK_DONE);
    } catch (error) {
      console.log(`Error on  FREE_QUESTION_ASK_DONE event : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "something write wrong Please try again.",
      });
    }
  });

  socket.on(ClientEvents.START_VOTING, () => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again",
        });

      if (!room.gameEngine.canStartVoting(player.id))
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "You don't have the permission to start the voting phase",
        });

      room.gameEngine.startVoting();
    } catch (error) {
      console.log(`Error on  START_VOTING event : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "something write wrong Please try again",
      });
    }
  });

  socket.on(ClientEvents.CAST_VOTE, (suspectID: string) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again",
        });

      if (room.gameEngine.state.phase !== "voting")
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "can't vote if round pahse is not voting",
        });

      room.gameEngine.castVote(player.id,suspectID);
    } catch (error) {
      console.log(`Error on  CAST_VOTE event : ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "something write wrong Please try again",
      });
    }
  });

  socket.on(ClientEvents.GUESS_TOPIC,(topicID: string) => {
    try {
      const player: Player = gameManager.getPlayerBySocketId(socket.id)!;
      const room: Room = player.room!;

      if (!player || !room)
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "something write wrong Please try again",
        });

      if(room.gameEngine.getCurrentRound?.spy.id !== player.id 
        && room.gameEngine.state.phase !== "guess-topic")
        return io.to(socket.id).emit(ServerEvents.ERROR, {
          message: "You do not have the authority to guess topic",
        });


        room.gameEngine.guessTopic(topicID,player.id);

        io.to(room.id).emit(ServerEvents.TOPIC_GUESSED, {})
    } catch (error) {
      console.log(`Error on GUESS_TOPIC event: ${error}`);
      io.to(socket.id).emit(ServerEvents.ERROR, {
        message: "something write wrong Please try again",
      });
    }
  });
};
