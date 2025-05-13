import { EventEmitter } from "events";
import {
  GameState,
  Player,
  GameEvent,
  Topic,
  VoteResult,
  TopicCategory,
  Round,
  Question,
} from "../models/index.js";

import { GameStateManager } from "./StateManager.js";
import {
  VotingSystem,
  FreeQuestionSystem,
  QuestionSystem,
  TopicManager,
  RoleSystem,
} from "../mechanics/index.js";

import { ERRORS } from "../errorMessages.js";

export class GameEngine extends EventEmitter {
  private stateManager: GameStateManager;
  private roleSystem: RoleSystem;
  private topicManager: TopicManager;
  private freeQuestionSystem: FreeQuestionSystem;
  private questionSystem: QuestionSystem;
  private votingSystem: VotingSystem;

  constructor(initialState?: Partial<GameState>) {
    super();
    this.stateManager = new GameStateManager(initialState);
    this.roleSystem = new RoleSystem();
    this.topicManager = new TopicManager();
    this.freeQuestionSystem = new FreeQuestionSystem();
    this.questionSystem = new QuestionSystem();
    this.votingSystem = new VotingSystem();
  }

  public addPlayer(player: Omit<Player, "score" | "role">): void {
    try {
      if (
        this.stateManager.state.players.some(
          (p: Player) => p.username === player.username
        )
      )
        throw Error(ERRORS.DUPLICATED_USERNAME);
      this.stateManager.addPlayer(player);

      this.emit(GameEvent.PLAYER_JOINED, player);
    } catch (error) {
      console.log(`Error adding player: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public get getCurrentRound(): Round | undefined {
    return this.stateManager.getCurrentRound();
  }

  public get state(): GameState {
    return this.stateManager.state;
  }

  public removePlayer(playerID: string): void {
    try {
      const player: Player = this.stateManager.state.players.find(
        (p: Player) => p.id === playerID
      )!;
      this.stateManager.removePlayer(playerID);

      this.emit(GameEvent.PLAYER_LEFT, player);

      if (
        this.stateManager
          .getCurrentRound()
          ?.players.some((player: Player) => player.id === playerID)
      ) {
        this.stateManager.resetForNewRound();
        this.emit(
          GameEvent.ROUND_ENDED,
          "the player in this round left frrom game"
        );
      }
    } catch (error) {
      console.log(`Error removing player: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  // ********* Topics functions  ************

  public selectCategory = (topicCategory: TopicCategory) => {
    try {
      this.stateManager.updateState({ selectedCategory: topicCategory });

      this.emit(GameEvent.CATEGORY_CHANGED, topicCategory);
    } catch (error) {
      console.log(`Error on update topic category: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  };

  public addTopic(topic: Omit<Topic, "id">) {
    try {
      if (this.stateManager.state.phase != "lobby")
        throw Error(ERRORS.UPDATE_TOPICS_LOBBY_ONLY);

      this.topicManager.addTopic(topic);
      this.emit(GameEvent.TOPICS_UPDATED, this.topicManager.topics);
    } catch (error) {
      console.log(`error on add topic: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public removeTopic(topicID: string) {
    try {
      if (this.stateManager.state.phase != "lobby")
        throw Error(ERRORS.UPDATE_TOPICS_LOBBY_ONLY);

      this.topicManager.removeTopic(topicID);
      this.emit(GameEvent.TOPICS_UPDATED, this.topicManager.topics);
    } catch (error) {
      console.log(`error on Remove topic: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public updateTopic(newTopic: Topic) {
    try {
      if (this.stateManager.state.phase != "lobby")
        throw Error(ERRORS.UPDATE_TOPICS_LOBBY_ONLY);

      this.topicManager.updateTopic(newTopic);
      this.emit(GameEvent.TOPICS_UPDATED, this.topicManager.topics);
    } catch (error) {
      console.log(`error on update topic: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public getTopics = (category?: TopicCategory): Topic[] =>
    this.topicManager.getTopics(category);

  // ***************************

  public startNewRound(): void {
    try {
      const players = this.stateManager.state.players;

      if (this.stateManager.state.phase != "lobby")
        throw Error(ERRORS.NOT_IN_LOBBY);

      if (players.length < 3) throw Error(ERRORS.NOT_ENOUGH_PLAYERS);

      // Assign roles and get random topic
      const updatedPlayers: Player[] = this.roleSystem.assignRoles(players);
      const topic: Topic = this.topicManager.getRandomTopic(
        this.stateManager.state.selectedCategory ?? "animals"
      );

      // update state and start new round
      this.stateManager.updateState({
        players: updatedPlayers,
        phase: "role-assignment",
      });

      this.stateManager.startNewRound(topic);

      this.emit(GameEvent.ROUND_STARTED, this.stateManager.getCurrentRound());
      this.emit(GameEvent.PHASE_CHANGED, this.state.phase);
    } catch (error) {
      console.log(`error on start new round : ${error}`);

      this.emit(GameEvent.ERROR, error);
    }
  }

  public startQuestionPhase(): void {
    try {
      this.stateManager.updateState({
        phase: "questions-phase",
      });

      this.questionSystem.setupQuestionOrder(
        this.stateManager.getCurrentRound()?.players!
      );

      this.emit(GameEvent.PHASE_CHANGED, this.stateManager.state.phase);
    } catch (error) {
      console.log(`Error starting question round: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public askNextQuestion(): Question | undefined {
    try {
      if (this.stateManager.state.phase !== "questions-phase")
        throw Error(ERRORS.INVALID_PHASE);

      if (this.questionSystem.thisLastQuestion) {
        this.freeQuestionSystem.setup(this.stateManager.state.players);
        this.stateManager.updateState({ phase: "free-questions-phase" });
        this.emit(GameEvent.PHASE_CHANGED, this.stateManager.state.phase);
      }
      
      const question: Question = this.questionSystem.getNextQuestion()!;
      
      if (question) this.emit(GameEvent.QUESTION_ASKED, question);
      

      return question;
    } catch (error) {
      console.log(`Error on ask question: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public askFreeQuestion(
    askerPlayerID: string,
    targetPlayerID: string
  ): Question | undefined {
    try {
      if (this.stateManager.state.phase != "free-questions-phase")
        throw Error(ERRORS.INVALID_PHASE);

      const question: Question = this.freeQuestionSystem.getNextQuestion(
        askerPlayerID,
        targetPlayerID
      )!;

      this.emit(GameEvent.FREE_QUESTION_ASKED, question);

      return question;
    } catch (error) {
      console.log(`Error on ask free question: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public canStartVoting = (playerID: string): boolean =>
    this.state.phase === "free-questions-phase" &&
    this.freeQuestionSystem.canStartVoting(playerID);

  public startVoting(): void {
    try {
      if (this.stateManager.state.phase != "free-questions-phase")
        throw Error(ERRORS.INVALID_PHASE);

      this.votingSystem.setup(this.stateManager.getCurrentRound()?.players!);
      this.stateManager.updateState({ phase: "voting" });
      this.emit(GameEvent.PHASE_CHANGED, this.stateManager.state.phase);
    } catch (error) {
      console.log(`Error on start voting: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public castVote(voterID: string, suspectID: string) {
    try {
      if (this.stateManager.state.phase != "voting")
        throw Error(ERRORS.INVALID_PHASE);

      const roundVotes: VoteResult[] =
        this.stateManager.getCurrentRound()?.votes!;

      const vote: VoteResult = this.votingSystem.vote(
        voterID,
        suspectID,
        roundVotes
      );

      this.stateManager.getCurrentRound()?.votes.push(vote);

      if (this.votingSystem.isVotingComplete(roundVotes)) {
        this.stateManager.updateState({ phase: "guess-topic" });
        this.emit(GameEvent.PHASE_CHANGED, this.stateManager.state.phase);
      }
    } catch (error) {
      console.log(`Error on start voting: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public guessTopic(topicID: string, playerID: string) {
    try {
      if (this.stateManager.state.phase != "guess-topic")
        throw Error(ERRORS.INVALID_PHASE);

      if (playerID !== this.stateManager.getCurrentRound()?.spy.id)
        throw Error(ERRORS.ONLY_SPY_CAN_GUESS);

      this.stateManager.getCurrentRound()!.guessedTopic =
        this.topicManager.getTopic(topicID);

      this.stateManager.endCurrentRound();

      this.emit(
        GameEvent.ROUND_ENDED,
        this.stateManager.state.rounds[
          this.stateManager.state.rounds.length - 1
        ]
      );
    } catch (error) {
      console.log(`Error on guess the topic: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public destroyRound(): void {
    try {
      if(this.stateManager.state.phase === "lobby")
        throw Error(ERRORS.INVALID_PHASE);

      const currentRound = this.stateManager.getCurrentRound();
      if (!currentRound) return;

      // Reset state to lobby and clear current round data
      this.stateManager.updateState({
        phase: "lobby",
        rounds: this.stateManager.state.rounds.filter(
          (r) => r.roundNumber !== this.stateManager.state.currentRound
        )
      });

      this.emit(GameEvent.ROUND_ENDED, "Round was destroyed");
      this.emit(GameEvent.PHASE_CHANGED, this.state.phase);
    } catch (error) {
      console.log(`Error destroying round: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }
}
