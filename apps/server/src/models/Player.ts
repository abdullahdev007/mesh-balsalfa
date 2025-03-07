import { nanoid } from "nanoid";
import Room from "./Room";

export default class Player {
  public id: string;
  public room: Room | undefined;

  constructor(
    public name: string,
    public socketId: string
  ) {
    this.id = this.generateUserId();
  }

  private generateUserId(): string {
    return nanoid(8);
  }


  public isMatchingSocket = (socketId: string): boolean => {
    return this.socketId === socketId;
  };
  
  public joinRoom(newRoom: Room) {
    try {
      //if player already in this room throw error
      if (newRoom.hasPlayer(this.id)) {
        throw new Error("This player already in this room");
      }

      // if player is already in other room leave from room befoar join to new room
      if (this.room !== undefined) {
        this.leaveRoom();
      }
      // join to room
      this.room = newRoom;
      this.room.addPlayer(this);
    } catch {
      console.log(`error on join ${this.id} player to ${newRoom.id} room`);
      throw new Error(`error on join player to room`);
    }
  }

  public leaveRoom() {
    try {
      // if player not in room throw error
      if (this.room === undefined) {
        throw new Error("Player is not in any room");
      }

      // leave from room
      this.room.removePlayer(this.id);
      this.room = undefined;
    } catch {
      console.log(`error on leave ${this.id} player to ${this.room?.id} room`);
      throw new Error(`error on leave player from room`);
    }
  }
}
