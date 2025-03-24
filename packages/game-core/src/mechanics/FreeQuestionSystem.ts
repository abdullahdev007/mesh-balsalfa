import { Player, Question } from "../models";

export class FreeQuestionSystem {
  private players: Player[] = [];
  private currentAskerIndex: number = 0;

  public setup(players: Player[]): void {
    this.players = players;
    this.currentAskerIndex = 0;
  }


  public getNextQuestion(
    askerPlayerID: string,
    targetPlayerID: string
  ): Question | null {
    if (this.players.length === 0) {
      throw new Error("No players available");
    }

    const asker : Player = this.players[this.currentAskerIndex]!;
    
    if(asker.id !== askerPlayerID) {
      throw new Error("is not asker player turn")
    }

    const target : Player = this.players.find((p) => p.id === targetPlayerID)!;

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
