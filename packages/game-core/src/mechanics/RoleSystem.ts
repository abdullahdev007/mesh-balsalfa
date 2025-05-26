import { Player, Role } from "../models/Player.js";

export class RoleSystem {
  assignRoles(players: Player[]): Player[] {
    const roles = this.generateRoles(players.length);
    return players.map((player, index) => ({
      ...player,
      role: roles[index],
    }));
  }

  private generateRoles(playerCount: number): Role[] {
    const roles = Array(playerCount - 1).fill("Insider");
    roles.push("Spy");
    return this.shuffleArray(roles);
  }

  private shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }
}
