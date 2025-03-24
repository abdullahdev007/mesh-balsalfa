import { threadId } from "worker_threads";
import { Player, Question } from "../models";

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
    this.questionOrder = this.shuffleArray(players);
    this.currentQuestionIndex = 0;
  }

  public getNextQuestion(askerPlayerID: string): Question | undefined {
    if (this.thisLastQuestion) return;

    const asker = this.questionOrder[this.currentQuestionIndex]!;

    if (asker.id !== askerPlayerID) throw new Error("is not asker player turn");

    const target =
      this.questionOrder[
        (this.currentQuestionIndex + 1) % this.questionOrder.length
      ]!;

    this.currentQuestionIndex++;
    return { asker, target };
  }

  private shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }

  public thisCurrentAsker(playerID: string) {
    return this.questionOrder[this.currentQuestionIndex]?.id!;
  }
}
