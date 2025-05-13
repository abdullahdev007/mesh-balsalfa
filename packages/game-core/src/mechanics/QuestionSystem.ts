import { Player, Question } from "../models/index.js";

export class QuestionSystem {
  private questionOrder: Player[] = [];
  private currentQuestionIndex: number = 0;

  public get thisLastQuestion() {
    return this.currentQuestionIndex >= this.questionOrder.length;
  }

  public get getQuestionOrder() {
    return this.questionOrder;
  }

  public setupQuestionOrder(players: Player[]): void {
    if (!players || !Array.isArray(players)) {
      throw new Error('Invalid players array provided to setupQuestionOrder');
    }
    this.questionOrder = this.shuffleArray([...players]);
    this.currentQuestionIndex = 0;
  }

  private shuffleArray<T>(array: T[]): T[] {
    if (!array || !Array.isArray(array)) {
      throw new Error('Invalid array provided to shuffleArray');
    }
    return [...array].sort(() => Math.random() - 0.5);
  }

  public getNextQuestion(): Question | undefined {
    if (this.thisLastQuestion) return;

    const asker: Player = this.questionOrder[this.currentQuestionIndex]!;


    const target =
      this.questionOrder[
        (this.currentQuestionIndex + 1) % this.questionOrder.length
      ]!;

    this.currentQuestionIndex++;
    return { asker, target };
  }

  public thisCurrentAsker(playerID: string) {
    return this.questionOrder[this.currentQuestionIndex]?.id!;
  }
}
