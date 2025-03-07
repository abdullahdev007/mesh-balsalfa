import { Topic } from "./Topic";

export class GamePlayer {
  constructor(
    public id: string,
    public name: string,
    public score: number = 0
  ) {}
} 
  
export class PlayerState {
  constructor(
    public player: GamePlayer,
    public isSpy: boolean,
    public asked: boolean = false,
    public voted: boolean = false,
    public voteCount: number = 0,
    public chosenTopic: Topic | null = null,
    public votedForPlayer: GamePlayer | null = null,
    public score: number = 0
  ) {}

  vote(player: GamePlayer, playerState: PlayerState): void {
    if (!this.voted) {
      this.voted = true;
      this.votedForPlayer = player;
      playerState.voteCount++;
    }
  }

  incrementScore(points: number = 1): void {
    this.score += points;
  }

  decrementScore(points: number = 1): void {
    this.score -= points;
  }
}
