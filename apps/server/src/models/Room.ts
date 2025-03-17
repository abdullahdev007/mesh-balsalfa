import Player from "./Player";
import { customAlphabet } from "nanoid";
import { Game, Round } from "@repo/game-core";
import RoundManager from "../managers/RoundManager";

export default class Room {
  public players: Player[] = [];
  public id: string;
  public admin: Player;
  public game: Game = new Game();
  public roundManager: RoundManager | undefined;

  constructor(admin: Player) {
    this.admin = admin;

    // On set admin, push to players list
    this.players.push(admin);

    // Create room id
    this.id = this.generateRoomId();
  }


  //start new round method
  startNewRound(): Round | null {
    const round = this.game.startRound();
    if (!round) return null;

    this.roundManager = new RoundManager(this);
    return round;
  }

  // Method for creating room ID (example output: "MN2REC")
  private generateRoomId(): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // A-Z & 0-9
    const nanoid = customAlphabet(alphabet, 6);
    return nanoid();
  }

  // Check if player is in the room
  public hasPlayer(playerId: string): boolean {
    return this.players.some((player) => player.id === playerId);
  }

  // Remove player from the room
  public removePlayer(playerId: string): void {
    // If player not in room, throw error
    if (!this.hasPlayer(playerId)) {
      throw new Error("This player is not in this room");
    }

    // Remove player from room
    this.players = this.players.filter((player) => player.id !== playerId);
    this.game.removePlayer(playerId);
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
    this.players.push(player);
    this.game.addPlayer(player.id, player.name);
  }
}
