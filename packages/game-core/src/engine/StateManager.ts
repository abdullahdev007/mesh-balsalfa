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

  public addPlayer(player: Omit<Player, "score" | "role">): void {
    const newPlayer: Player = {
      ...player,
      role: undefined,
      score: 0,
    };
    this.state.players.push(newPlayer);
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
    this.determineScores();
    this.state.currentRound++;
    this.resetForNewRound();
  }

  public resetForNewRound(): void {
    this.updateState({
      phase: "lobby",
    });
  }

  public determineScores(): void {
    const currentRound = this.getCurrentRound();
    if (!currentRound) throw new Error("No active round found");

    const { players, votes, spy, guessedTopic } = currentRound;

    const insiderVotes = votes.filter(
      (vote: VoteResult) => vote.voterID !== spy.id
    );

    const spyGuessedCorrectly = guessedTopic?.id === currentRound.topic.id;

    const correctVotes = insiderVotes.filter(
      (vote: VoteResult) => vote.suspectID === spy.id
    );
    const allInsidersGuessedCorrectly: boolean =
      correctVotes.length === players.length - 1;
    const allInsidersGuessedWrong: boolean = correctVotes.length === 0;

    const scores: ScoreEntry[] = players.map((player) => {
      let score = 0;

      if (player.role === "Spy") {
        if (spyGuessedCorrectly) score += 10;
        if (allInsidersGuessedCorrectly) score -= 5;
        if (allInsidersGuessedWrong) score += 5;
      } else if (
        votes.find((vote: VoteResult) => vote.voterID === player.id)
          ?.suspectID === spy.id
      )
        score += 10;

      return {
        playerID: player.id,
        score,
      };
    });

    currentRound.scores = scores;

    // 5. تحديث النقاط الإجمالية للاعبين
    this.updateTotalScores(scores);
  }

  private updateTotalScores(scores: ScoreEntry[]): void {
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
