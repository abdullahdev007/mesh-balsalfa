import { Player } from ".";
import { customAlphabet } from "nanoid";
import { GameEngine } from "@repo/game-core"
import { RoundManager } from "../managers";
export class Room {
  public players: Map<string, Player> = new Map();
  public id: string;
  public admin: Player;
  public gameEngine: GameEngine;
  public roundManager: RoundManager;

  constructor(admin: Player) {
    this.admin = admin;

    this.players.set(admin.id, admin);

    this.id = this.generateRoomId();

    this.gameEngine = new GameEngine();

    this.roundManager = new RoundManager(this);
  }

  // Method for creating room ID (example output: "MN2REC")
  private generateRoomId(): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // A-Z & 0-9
    const nanoid = customAlphabet(alphabet, 6);
    return nanoid();
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
    this.gameEngine.addPlayer(player.gamePlayer)
    this.players.set(player.id, player);
  }

  // Remove player from the room
  public removePlayer(playerId: string): void {
    // If player not in room, throw error
    if (!this.hasPlayer(playerId)) {
      throw new Error("This player is not in this room");
    }

    // Remove player from room
    this.gameEngine.removePlayer(playerId)
    this.players.delete(playerId);
  }

  //check if player in room 
  public hasPlayer = (playerId: string): boolean =>  this.players.has(playerId);



  
}
