import {
  GameState,
  Player,
  Role,
  Round,
  ScoreEntry,
  Topic,
  TopicCategory,
  VoteResult,
} from "../models";

export class GameStateManager {
  state: GameState;

  constructor(initialState?: Partial<GameState>) {
    this.state = {
      players: [],
      currentRound: 1,
      totalRounds: 0,
      rounds: [],
      totalScores: [],
      phase: "lobby",
      selectedCategory: undefined,
      ...initialState,
    };
  }

  public getSpyPlayer = (): Player | undefined =>
    this.state.players.find((player) => player.role === "Spy");

  public updateState = (updates: Partial<GameState>) =>
    (this.state = { ...this.state, ...updates });

  public addPlayer(player: Omit<Player, "score" | "role">): Player {
    const newPlayer: Player = {
      ...player,
      role: undefined,
      score: 0,
    };
    this.state.players.push(newPlayer);

    return newPlayer;
  }

  public removePlayer = (playerID: string) =>
    (this.state.players = this.state.players.filter(
      (player: Player) => player.id !== playerID
    ));

  public startNewRound(topic: Topic): void {
    this.state.rounds.push({
      roundNumber: this.state.currentRound,
      topic: topic,
      topicCategory: topic.category,
      players: this.state.players,
      votes: [],
      scores: [],
      guessedTopic: null,
      spy: this.getSpyPlayer()!,
    });
  }

  public endCurrentRound(): void {
    this.state.currentRound++;
    this.resetForNewRound();
  }

  public resetForNewRound(): void {
    this.updateState({
      phase: "lobby",
    });
  }

  public updateTotalScores(scores: ScoreEntry[]): void {
    scores.forEach((roundScore) => {
      const player = this.state.players.find(
        (p) => p.id === roundScore.playerID
      );
      if (player) {
        player.score += roundScore.score;
      }
    });
  }

  public getCurrentRound = (): Round | undefined =>
    this.state.rounds.find((r) => r.roundNumber === this.state.currentRound);
}
