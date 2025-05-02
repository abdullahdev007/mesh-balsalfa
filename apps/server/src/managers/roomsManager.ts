import { Player, Room } from "../models";

export class RoomsManager {
  public rooms: Room[] = [];

  constructor() {}

  createRoom(admin: Player): Room {
    try {
      const room: Room = new Room(admin);
      this.rooms.push(room);
      admin.room = room;

      console.log(`Room with ${room.id} is created by ${admin.name} player`);
      return room;
    } catch (error) {
      console.log(`Error on create new room`, error);
      throw error;
    }
  }

  destroyRoom(roomId: string): boolean {
    try {
      // Find the room
      const room = this.rooms.find((room: Room) => room.id === roomId);

      // If room is not found, throw an error
      if (!room) {
        throw new Error(`Room with ID ${roomId} not found`);
      }

      // Remove all players from the room and destroy room
      room.players.forEach((player: Player) => player.leaveRoom());
      this.rooms = this.rooms.filter((room: Room) => room.id !== roomId);

      console.log(`Room with ID ${roomId} successfully destroyed.`);

      return true;
    } catch (error) {
      console.error(`Error destroying room ${roomId}:`, error);
      throw error;
    }
  }

  // Method to find a room by its ID
  getRoomById(roomId: string): Room {
    try {
      const room = this.rooms.find((room: Room) => room.id === roomId);
      if (!room) {
        throw new Error(`Room with ID ${roomId} not found`);
      }
      return room;
    } catch (error) {
      console.error(`Error getting room with ID ${roomId}:`, error);
      throw error;
    }
  }
}
