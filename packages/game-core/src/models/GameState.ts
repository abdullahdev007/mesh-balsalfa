import { Player } from "./Player";
import { Topic, TopicCategory } from "./Topic";

export interface GameState {
  players: Player[];
  currentRound: number;
  totalRounds: number;
  rounds: Round[];
  totalScores: ScoreEntry[];
  phase: GamePhase;
  selectedTopicCategory: TopicCategory | undefined;
}

export interface Round {
  roundNumber: number;
  topic: Topic;
  topicCategory: TopicCategory;
  spy: Player;
  players: Player[];
  votes: VoteResult[];
  scores: ScoreEntry[];
  guessedTopic: Topic | null;
}

export interface Question {
  asker: Player;
  target: Player;
}

export interface VoteResult {
  voterID: string;
  suspectID: string;
}

export interface ScoreEntry {
  playerID: string;
  score: number;
}

export type GamePhase =
  | "lobby"
  | "role-assignment"
  | "questions-phase"
  | "free-questions-phase"
  | "voting"
  | "guess-topic";
