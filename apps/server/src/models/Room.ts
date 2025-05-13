import { Player } from "./index.js";
import { RoundManager } from "../managers/index.js";
import { GameEngine } from "@repo/game-core";
import { customAlphabet } from "nanoid";
export class Room {
  public players: Map<string, Player> = new Map();
  public id: string;
  public admin: Player;
  public gameEngine: GameEngine;
  public roundManager: RoundManager;

  constructor(admin: Player) {
    this.admin = admin;
    this.players.set(admin.id, admin);
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
        `Player already in another room (room id: ${player.room.id})`
      );
    }

    // Add player to room
    player.room = this;
    this.gameEngine.addPlayer(player.gamePlayer);
    this.players.set(player.id, player);
  }

  // Remove player from the room
  public removePlayer(playerId: string): void {
    // If player not in room, throw error
    if (!this.hasPlayer(playerId)) {
      throw new Error("This player is not in this room");
    }

    // Remove player from room
    const player = this.players.get(playerId);
    if (player) {
      player.room = undefined;
    }
    this.gameEngine.removePlayer(playerId);
    this.players.delete(playerId);
  }

  //check if player in room
  public hasPlayer = (playerId: string): boolean => this.players.has(playerId);

  public toJSON() {
    return {
      id: this.id,
      admin: this.admin,
      players: Array.from(this.players.values()),
      gameEngine: this.gameEngine,
    };
  }
}
