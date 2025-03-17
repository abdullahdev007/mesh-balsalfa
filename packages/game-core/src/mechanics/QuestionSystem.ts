import { Player } from "../models";

export class QuestionSystem {
  private questionOrder: Player[] = [];
  private currentQuestionIndex: number = 0;

  public setupQuestionOrder(players: Player[]): void {
    this.questionOrder = this.shuffleArray(players);
    this.currentQuestionIndex = 0;
  }

  public getNextQuestion(): { asker: Player; target: Player } | null {
    if (this.currentQuestionIndex >= this.questionOrder.length) {
      return null; 
    }

    const asker = this.questionOrder[this.currentQuestionIndex]!;
    const target = this.questionOrder[(this.currentQuestionIndex + 1) % this.questionOrder.length]!;

    this.currentQuestionIndex++;
    return { asker, target };
  }

  private shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }

  public thisLastQuestion = () => this.currentQuestionIndex >= this.questionOrder.length
}