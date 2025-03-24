import { GameEngine } from "./engine";
import { GameEvent, GamePhase, GameState, Player, Round } from "./models";

export * from "./engine";
export * from "./models";
export * from "./models";

// Simple Test Game Core

const gameEngine = new GameEngine();

gameEngine.on(GameEvent.ROUND_STARTED, (round: Round) => {
  console.log(`round started`);
  console.log("--------------");
  console.log(`this round topic is ${round.topic.category}`);
});

gameEngine.on(GameEvent.ROUND_ENDED, (round: Round) => {
  console.log("round ended");
  console.log(round);
});

gameEngine.on(GameEvent.STATE_UPDATED, (state: GameState) => {
  console.log("state updateed");
  console.log(state);
});

gameEngine.on(GameEvent.PLAYER_JOINED, (player: Player) => {
  console.log(`player joined: ${player.name}`);
});

gameEngine.on(GameEvent.PLAYER_LEFT, (player: Player) => {
  console.log(`player left: ${player.name}`);
});

gameEngine.on(
  GameEvent.QUESTION_ASKED,
  (question: { asker: Player; target: Player }) => {
    console.log(`${question.asker.name} asked ${question.target.name}`);
  }
);

gameEngine.on(
  GameEvent.FREE_QUESTION_ASKED,
  (question: { asker: Player; target: Player }) => {
    console.log(
      `${question.asker.name} Choose ask ${question.target.name} and not vote`
    );
  }
);

gameEngine.on(GameEvent.PHASE_CHANGED, (phase: GamePhase) => {
  console.log(`phase changed to ${phase}`);
});

gameEngine.on(GameEvent.ERROR, (error) => {
  console.log(error);
});

/** test topic manager code (in lobby) */
/*
  const categroy: TopicCategory = "animals"
  gameEngine.on(GameEvent.TOPICS_UPDATED,(topics: Topic[]) => {
    console.log("topics in game are updated");
    const categoryTopics = topics.filter((t: Topic) => t.category == categroy).map((t:Topic) => t.name);
    console.log(categoryTopics.length);
  })
  gameEngine.addTopic({category:"animals",name:"test animal topic"})
  gameEngine.removeTopic(gameEngine.getTopics(categroy)[0]!.id);

  gameEngine.changeTopicCategory('foods')
*/

// add player tests
gameEngine.addPlayer({ id: "player1", name: "abdullah" });
gameEngine.addPlayer({ id: "player2", name: "ali" });
gameEngine.addPlayer({ id: "player3", name: "osman" });
gameEngine.addPlayer({ id: "player4", name: "ahmed" });
gameEngine.addPlayer({ id: "player5", name: "alice" });

//remove player tests
gameEngine.removePlayer("player5");

//start round

gameEngine.startNewRound();

const round: Round = gameEngine.getCurrentRound!;
const spy: Player = round.spy;

gameEngine.startQuestionPhase();

gameEngine.askNextQuestion();
gameEngine.askNextQuestion();
gameEngine.askNextQuestion();
gameEngine.askNextQuestion();

gameEngine.askFreeQuestion("player2");
gameEngine.askFreeQuestion("player3");
gameEngine.askFreeQuestion("player2");
gameEngine.askFreeQuestion("player1");

gameEngine.startVoting();

gameEngine.castVote("player1", "player3");
gameEngine.castVote("player2", "player3");
gameEngine.castVote("player3", "player3");
gameEngine.castVote("player4", "player3");

// spy guess correct topic status
gameEngine.guessTopic(round.topic.id, spy.id);
