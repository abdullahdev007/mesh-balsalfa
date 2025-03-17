import { Player } from "../models";

export class FreeQuestionSystem {
  private players: Player[] = [];
  private currentAskerIndex: number = 0;

  public setup(players: Player[]): void {
    this.players = players;
    this.currentAskerIndex = 0;
  }

  // الحصول على السؤال التالي
  public getNextQuestion(
    targetPlayerId: string
  ): { asker: Player; target: Player } | null {
    if (this.players.length === 0) {
      throw new Error("No players available");
    }


    const asker : Player = this.players[this.currentAskerIndex]!;
    const target : Player = this.players.find((p) => p.id === targetPlayerId)!;

    if (!target) {
      throw new Error("target player not found");
    }

    this.currentAskerIndex = (this.currentAskerIndex + 1) % this.players.length;
    return { asker, target };
  }

  public canStartVoting = (playerId: string): boolean => this.players[this.currentAskerIndex]?.id === playerId;


  public reset(): void {
    this.players = [];
    this.currentAskerIndex = 0;
  }
}
