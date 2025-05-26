import { Player } from "../models/index.js";
import { RoomsManager } from "./index.js";

export class GameManager {
  public players: Player[] = [];
  public roomsManager: RoomsManager = new RoomsManager();

  constructor() {}

  addPlayer(socketId: string, name: string) {
    try {
      // If this client (socket) is already in the game, throw an error
      if (
        this.players.some((player: Player) => player.isMatchingSocket(socketId))
      ) {
        throw new Error("this socket id already in game");
      }

      // Create player and add to game
      let player: Player = new Player(name, socketId);
      this.players.push(player);
    } catch (error) {
      console.log(`Error adding "${socketId}" player to game: ${error}`);
      throw new Error("Error adding player to game");
    }
  }

  removePlayer(socketId: string) {
    try {
      // If player is not in game, throw error
      if (
        !this.players.some((player: Player) =>
          player.isMatchingSocket(socketId),
        )
      ) {
        throw new Error("this socket id is not in game");
      }

      // Remove player from game

      this.players = this.players.filter((player: Player) => {
        return player.socketId !== socketId;
      });
    } catch (error) {
      console.log(`Error removing "${socketId}" player from game: ${error}`);
      throw new Error("Error removing player from game");
    }
  }

  getPlayerBySocketId(socketId: string): Player | null {
    try {
      const player = this.players.find(
        (player: Player) => player.socketId === socketId,
      );
      if (!player) {
        throw new Error("Player not found");
      }
      return player;
    } catch (error) {
      console.log(`Error fetching player by socketId "${socketId}": ${error}`);
      return null;
    }
  }
}
