import { EventEmitter } from "events";
import {
  GameState,
  Player,
  GameEvent,
  Topic,
  VoteResult,
  TopicCategory,
} from "../models";

import { GameStateManager } from "./StateManager";
import {
  VotingSystem,
  FreeQuestionSystem,
  QuestionSystem,
  TopicManager,
  RoleSystem,
} from "../mechanics";

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
      this.stateManager.addPlayer(player);

      this.emit(GameEvent.PLAYER_JOINED, player);
    } catch (error) {
      console.log(`Error adding player: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
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

  public getPlayers = (): Player[] => this.stateManager.state.players;

  public changeTopicCategory = (topicCategory: TopicCategory) => {
    try {
      this.stateManager.updateState({ selectedTopicCategory: topicCategory });

      this.emit(GameEvent.STATE_UPDATED, this.stateManager.state);
    } catch (error) {
      console.log(`Error on update topic category: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  };

  public addTopic(topic: Omit<Topic, "id">) {
    try {
      if (this.stateManager.state.phase != "lobby")
        throw Error("can update topic only on lobby phase");
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
        throw Error("can update topic only on lobby phase");
      console.log("test");

      this.topicManager.removeTopic(topicID);
      this.emit(GameEvent.TOPICS_UPDATED, this.topicManager.topics);
    } catch (error) {
      console.log(`error on Remove topic: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public getTopics = (category?: TopicCategory): Topic[] =>
    this.topicManager.getTopics(category);



  public getCurrentRound = () => this.stateManager.getCurrentRound();
  public startNewRound(): void {
    try {
      const players = this.stateManager.state.players;

      // Assign roles and get random topic
      const updatedPlayers: Player[] = this.roleSystem.assignRoles(players);
      const topic: Topic = this.topicManager.getRandomTopic(
        this.stateManager.state.selectedTopicCategory
      );

      // update state and start new round
      this.stateManager.updateState({
        players: updatedPlayers,
      });

      this.stateManager.startNewRound(topic);
      this.emit(GameEvent.ROUND_STARTED, this.stateManager.getCurrentRound());
    } catch (error) {
      console.log(`error on start new round : ${error}`);

      this.emit(GameEvent.ERROR, error);
    }
  }

  public startQuestionRound(): void {
    try {
      this.stateManager.updateState({
        phase: "question-round",
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

  public askNextQuestion(): void {
    try {
      if (this.stateManager.state.phase !== "question-round")
        throw Error("cant ask question if round phase not question-round");

      const nextQuestion = this.questionSystem.getNextQuestion();

      if (nextQuestion) {
        this.emit(GameEvent.QUESTION_ASKED, nextQuestion);
      }

      if (this.questionSystem.thisLastQuestion()) {
        this.freeQuestionSystem.setup(this.stateManager.state.players);
        this.stateManager.updateState({ phase: "free-question-round" });
        this.emit(GameEvent.PHASE_CHANGED, this.stateManager.state.phase);
      }
    } catch (error) {
      console.log(`Error on ask question: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public askFreeQuestion(targetPlayerId: string): void {
    try {
      if (this.stateManager.state.phase != "free-question-round")
        throw Error(
          "cant ask free question if round phase not free-question-round"
        );

      const nextQuestion =
        this.freeQuestionSystem.getNextQuestion(targetPlayerId);
      this.emit(GameEvent.FREE_QUESTION_ASKED, nextQuestion);
    } catch (error) {
      console.log(`Error on ask free question: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public startVoting(): void {
    try {
      if (this.stateManager.state.phase != "free-question-round")
        throw Error("cant start voting befor free questions round");

      this.votingSystem.setup(this.stateManager.getCurrentRound()?.players!);
      this.stateManager.updateState({ phase: "voting" });
      this.emit(GameEvent.PHASE_CHANGED, this.stateManager.state.phase);
    } catch (error) {
      console.log(`Error on start voting: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public vote(voterID: string, suspectID: string) {
    try {
      if (this.stateManager.state.phase != "voting")
        throw Error("cant vote if round pahse is not voting");

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
        this.emit(GameEvent.PHASE_CHANGED,this.stateManager.state.phase);
      }
    } catch (error) {
      console.log(`Error on start voting: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public guessTopic(topicID: string, playerID: string) {
    try {
      if (this.stateManager.state.phase != "guess-topic")
        throw Error('can"t guess the topic if round phase is not guess-topic');

      if (playerID !== this.stateManager.getCurrentRound()?.spy.id)
        throw Error("only spy player can guess the topic");

      this.stateManager.getCurrentRound()!.guessedTopic = this.topicManager.getTopic(topicID);

      this.stateManager.endCurrentRound();
      

      this.emit(GameEvent.ROUND_ENDED, this.stateManager.state.rounds[this.stateManager.state.rounds.length - 1]);
    } catch (error) {
      console.log(`Error on guess the topic: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }
}
