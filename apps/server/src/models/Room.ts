import { Player } from "./index.js";
import { RoundManager } from "../managers/index.js";
import { GameEngine } from "@repo/game-core";
import { customAlphabet } from "nanoid";
import { SERVER_ERROR_MESSAGES, ServerErrorType } from "@repo/shared";
export class Room {
  public players: Player[] = [];
  public id: string;
  public admin: Player;
  public gameEngine: GameEngine;
  public roundManager: RoundManager;

  constructor(admin: Player) {
    this.admin = admin;
    this.players.push(admin);
    this.id = Room.generateRoomId();
    this.gameEngine = new GameEngine();
    this.roundManager = new RoundManager(this);
    admin.room = this;
  }

  // Method for creating room ID (example output: "MN2REC")
  private static generateRoomId(): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const generateId = customAlphabet(alphabet, 6);
    return generateId();
  }

  // Add player to the room
  public addPlayer(player: Player): void {
    // If player already in another room, throw error
    if (player.room !== undefined) {
      throw new Error(
        `Player already in another room (room id: ${player.room.id})`,
      );
    }

    // Check if room is full
    if (this.players.length >= 12) {
      throw new Error(
        SERVER_ERROR_MESSAGES[ServerErrorType.MAX_PLAYERS_REACHED],
      );
    }

    // Add player to room
    player.room = this;
    this.gameEngine.addPlayer(player.gamePlayer);
    this.players.push(player);
  }

  // Remove player from the room
  public removePlayer(playerId: string): void {
    // If player not in room, throw error
    if (!this.hasPlayer(playerId)) {
      throw new Error("This player is not in this room");
    }

    // Remove player from room
    const player = this.players.find((p: Player) => p.id === playerId);
    if (player) {
      player.room = undefined;
    }
    this.gameEngine.removePlayer(playerId);
    this.players = this.players.filter((p: Player) => p.id !== playerId);
  }

  //check if player in room
  public hasPlayer = (playerId: string): boolean =>
    this.players.some((player) => player.id === playerId);

  public toJSON() {
    return {
      id: this.id,
      admin: this.admin,
      players: Array.from(this.players.values()),
      gameEngine: this.gameEngine,
    };
  }
}
