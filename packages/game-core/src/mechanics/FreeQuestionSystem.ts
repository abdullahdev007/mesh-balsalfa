import { Player, Question } from "../models/index.js";

export class FreeQuestionSystem {
  private players: Player[] = [];

  public setup(players: Player[]): void {
    this.players = players;
  }

  public getNextQuestion(
    askerPlayerID: string,
    targetPlayerID: string,
  ): Question | null {
    if (this.players.length === 0) {
      throw new Error("No players available");
    }

    const target: Player = this.players.find((p) => p.id === targetPlayerID)!;
    const asker: Player = this.players.find((p) => p.id === askerPlayerID)!;

    if (!target || !asker) {
      throw new Error("target or asker player not found");
    }

    return { asker, target };
  }

  public reset(): void {
    this.players = [];
  }
}
