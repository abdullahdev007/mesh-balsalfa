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
  ScoreEntry,
  GamePhase,
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
      if (this.stateManager.state.players.length >= 12) {
        throw Error(ERRORS.MAX_PLAYERS_REACHED);
      }
      if (
        this.stateManager.state.players.some(
          (p: Player) => p.username === player.username
        )
      )
        throw Error(ERRORS.DUPLICATED_USERNAME);
      const newPlayer: Player = this.stateManager.addPlayer(player);

      this.emit(GameEvent.PLAYER_JOINED, newPlayer);
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

      const guessList: Topic[] = this.topicManager.getGuessList(
        topic,
        this.state.selectedCategory ?? "animals"
      );

      this.stateManager.startNewRound(topic, guessList);

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

      if (this.votingSystem.isVotingComplete(roundVotes)) this.showSpy();
    } catch (error) {
      console.log(`Error on start voting: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public showSpy() {
    try {
      if (this.stateManager.state.phase != "voting")
        throw Error(ERRORS.INVALID_PHASE);

      const currentRound = this.stateManager.getCurrentRound();
      if (!currentRound) throw new Error("No active round found");

      const { players, votes, spy } = currentRound;

      // Calculate insider scores
      const scores: ScoreEntry[] = players.map((player) => {
        let score = 0;
        if (
          player.role === "Insider" &&
          votes.find((vote: VoteResult) => vote.voterID === player.id)
            ?.suspectID === spy.id
        ) {
          score += 10;
        }
        return { playerID: player.id, score };
      });

      currentRound.scores = scores;
      this.stateManager.updateTotalScores(scores);

      this.stateManager.updateState({ phase: "show-spy" });
      this.emit(GameEvent.PHASE_CHANGED, this.stateManager.state.phase);
    } catch (error) {
      console.log(`Error on show spy: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public startGuessTopic(): void {
    try {
      if (this.stateManager.state.phase !== "show-spy") {
        throw Error(ERRORS.INVALID_PHASE);
      }

      this.stateManager.updateState({ phase: "guess-topic" });
      this.emit(GameEvent.PHASE_CHANGED, this.stateManager.state.phase);
    } catch (error) {
      console.log(`Error starting guess topic phase: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public guessTopic(topicID: string, playerID: string) {
    try {
      if (this.stateManager.state.phase != "guess-topic")
        throw Error(ERRORS.INVALID_PHASE);

      if (playerID !== this.stateManager.getCurrentRound()?.spy.id)
        throw Error(ERRORS.ONLY_SPY_CAN_GUESS);

      const currentRound = this.stateManager.getCurrentRound()!;
      currentRound.guessedTopic = this.topicManager.getTopic(topicID);

      // Calculate spy score
      const spyGuessedCorrectly =
        currentRound.guessedTopic?.id === currentRound.topic.id;
      const correctVotes = currentRound.votes.filter(
        (vote: VoteResult) =>
          vote.voterID !== currentRound.spy.id &&
          vote.suspectID === currentRound.spy.id
      );
      const allInsidersGuessedCorrectly =
        correctVotes.length === currentRound.players.length - 1;
      const allInsidersGuessedWrong = correctVotes.length === 0;

      let spyScore = 0;
      if (spyGuessedCorrectly) spyScore += 10;
      if (allInsidersGuessedCorrectly) spyScore -= 5;
      if (allInsidersGuessedWrong) spyScore += 5;

      // Update spy score in current round scores
      const updatedScores = [...currentRound.scores];
      const spyScoreEntry = { playerID: currentRound.spy.id, score: spyScore };
      const spyIndex = updatedScores.findIndex(
        (s) => s.playerID === currentRound.spy.id
      );
      if (spyIndex >= 0) {
        updatedScores[spyIndex] = spyScoreEntry;
      } else {
        updatedScores.push(spyScoreEntry);
      }
      currentRound.scores = updatedScores;

      // Update total scores
      this.stateManager.updateTotalScores([spyScoreEntry]);

      this.emit(GameEvent.TOPIC_GUESSED, {
        guessedTopic: this.getCurrentRound?.guessedTopic,
        correctTopic: this.getCurrentRound?.topic
      });
    } catch (error) {
      console.log(`Error on guess the topic: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }


  public endRound(): void {
    try {
      if (this.stateManager.state.phase === "lobby")
        throw Error(ERRORS.INVALID_PHASE);

      this.stateManager.endCurrentRound();

      this.emit(GameEvent.PHASE_CHANGED, this.state.phase);
      this.emit(GameEvent.ROUND_ENDED, "Round was ended");
    }catch (error) {
      console.log(`Error ending round: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }

  public destroyRound(): void {
    try {
      if (this.stateManager.state.phase === "lobby")
        throw Error(ERRORS.INVALID_PHASE);

      const currentRound = this.stateManager.getCurrentRound();
      if (!currentRound) return;

      // Reset state to lobby and clear current round data
      this.stateManager.updateState({
        phase: "lobby",
        rounds: this.stateManager.state.rounds.filter(
          (r) => r.roundNumber !== this.stateManager.state.currentRound
        ),
      });

      this.emit(GameEvent.ROUND_ENDED, "Round was destroyed");
      this.emit(GameEvent.PHASE_CHANGED, this.state.phase);
    } catch (error) {
      console.log(`Error destroying round: ${error}`);
      this.emit(GameEvent.ERROR, error);
    }
  }
}
