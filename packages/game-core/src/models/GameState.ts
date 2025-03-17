import { Player } from "./Player";
import { Topic, TopicCategory } from "./Topic";

export interface GameState {
  players: Player[];
  currentRound: number;
  totalRounds: number;
  rounds: RoundHistory[];
  totalScores: ScoreEntry[];
  phase: GamePhase;
  selectedTopicCategory: TopicCategory | undefined;
}


export interface RoundHistory {
  roundNumber: number;
  topic: Topic;
  topicCategory: TopicCategory,
  spy: Player
  players: Player[]
  votes: VoteResult[];
  scores: ScoreEntry[];
  guessedTopic: Topic | null;
}

export interface VoteResult {
  voterID: string,
  suspectID: string
}

export interface ScoreEntry {
  playerID: string,
  score: number
}

export type GamePhase =
  | "lobby"
  | "role-assignment"
  | "question-round"
  | "free-question-round"
  | "voting"
  | "guess-topic";
