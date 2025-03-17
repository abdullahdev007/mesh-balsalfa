import { Server, Socket } from "socket.io";
import GameManager from "../managers/gameManager";
import RoomsManager from "../managers/roomsManager";
import Room from "../models/Room";
import Player from "../models/Player";
import { Round } from "@repo/game-core";
import RoundManager from "../managers/RoundManager";
import AskPhase from "@repo/game-core/dist/entities/Phases/AskPhase";

export const handleRoundEvents = (
  io: Server,
  socket: Socket,
  gameManager: GameManager
) => {
  const roomsManager: RoomsManager = gameManager.roomsManager;

  socket.on("startRound", (roomId: string) => {
    try {
      const room: Room | undefined = roomsManager.getRoomById(roomId);
      if (!room) {
        return io
          .to(socket.id)
          .emit("error", { message: `Room ${roomId} not found` });
      }

      const admin: Player | undefined = room.admin;
      if (!admin || !admin.isMatchingSocket(socket.id)) {
        return io
          .to(socket.id)
          .emit("error", { message: "Only the admin can start the round" });
      }

      // Start round and notify all players
      const round: Round | null = room.game.startRound();

      if (!round) {
        return io.to(socket.id).emit("error", {
          message: "Failed to start round, please try again",
        });
      }

      io.to(roomId).emit("roundStarted", { roomId, roundId: round.id });

      console.log(`Round started in room ${roomId} by ${admin.name}`);
    } catch (error) {
      console.log("Error starting round:", error);
      io.to(socket.id).emit("error", {
        message: "Failed to start round, please try again",
      });
    }
  });

  socket.on("requestRole", (roomId: string) => {
    try {
      const room: Room | undefined = roomsManager.getRoomById(roomId);
      if (!room)
        return io
          .to(socket.id)
          .emit("error", { message: `Room ${roomId} not found` });

      const round: Round | undefined = room.game.currentRound;
      if (!round)
        return io.to(socket.id).emit("error", { message: "No active round" });

      const player = round.players.find((player) =>
        room.players
          .find((p) => p.id === player.id)
          ?.isMatchingSocket(socket.id)
      );

      if (!player)
        return io
          .to(socket.id)
          .emit("error", { message: "Failed to retrieve role" });

      // Determine the role and send it to the player
      const isSpy = player.id === round.spy.id;
      const roleMessage = isSpy
        ? { role: "spy" }
        : { role: "inTopic", topic: round.topic.name };

      io.to(socket.id).emit("roleAssigned", roleMessage);
    } catch (error) {
      console.log("Error assigning role:", error);
      io.to(socket.id).emit("error", { message: "Failed to retrieve role" });
    }
  });

  socket.on("startAsks", (roomId: string) => {
    try {
      const room: Room | undefined = roomsManager.getRoomById(roomId);
      const roundManager: RoundManager | undefined = room?.roundManager;

      if (!room || !roundManager)
        return io
          .to(socket.id)
          .emit("error", { message: `Room ${roomId} not found` });

      const round: Round | undefined = room.game.currentRound;
      if (!round)
        return io.to(socket.id).emit("error", { message: "No active round" });

      const player = room.players.find((p) => p.isMatchingSocket(socket.id));
      if (!player)
        return io
          .to(socket.id)
          .emit("error", { message: "Failed to find a player" });

      const waitingListComplete: boolean =
        roundManager.addPlayerToWaitingList(player);

      if (waitingListComplete) {
        roundManager.clearTimeout();
        const askPhase: AskPhase | undefined = round.nextTurn();

        io.to(roomId).emit("asksPhaseStarted", askPhase);
      } else if (roundManager.waitingList.size === 1) {
        roundManager.startTimeout(60000).then((completed: boolean) => {
          if (completed) {
            const askPhase: AskPhase | undefined = round.nextTurn();
            io.to(roomId).emit("asksPhaseStarted", askPhase);
          }
        });
        io.to(roomId).emit("startAsksTimer");
      }
    } catch (error) {
      console.log("Error on start asks", error);
      io.to(socket.id).emit("error", {
        message: "Error while requesting to start asks. Please try again.",
      });
    }
  });

  socket.on("nextTurn", (roomId: string) => {
    const room: Room | undefined = roomsManager.getRoomById(roomId);
    const roundManager: RoundManager | undefined = room?.roundManager;

    if (!room || !roundManager)
      return io
        .to(socket.id)
        .emit("error", { message: `Room ${roomId} not found` });

    const round: Round | undefined = room.game.currentRound;
    if (!round)
      return io.to(socket.id).emit("error", { message: "No active round" });
  });
};
