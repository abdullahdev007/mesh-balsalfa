import { Player } from "./entities/Player";
import { Round } from "./entities/Round";
import { Topic } from "./entities/Topic";
import { TopicCategory } from "./entities/TopicCategory";
import { Game } from "./Game";

export * from "./Game";
export * from "./entities/Player";
export * from "./entities/Topic";
export * from "./entities/TopicCategory";
export * from "./entities/Round";

const game = new Game();

const ali: Player = game.addPlayer("ali");
const ahmed: Player = game.addPlayer("ahmed");
const abdullah: Player = game.addPlayer("abdullah");
const noor: Player = game.addPlayer("noor");

// Testing Topic Code
/*
    console.log(game.topics.length);
    const newTopic: Topic = game.addTopic("testTopic", TopicCategory.Cartoons);
    console.log(newTopic);
    console.log(game.topics.length);
    game.updateTopic(newTopic.id, "testTopic2");
    console.log(newTopic.name);
    game.deleteTopic(newTopic.id);
    console.log(game.topics.length);
*/

const round: Round = game.startRound()!;

round.giveRole();
round.giveRole();
round.giveRole();
round.giveRole();

console.log("--------------------");

round.nextTurn();
round.nextTurn();
round.nextTurn();
round.nextTurn();
round.nextTurn();

console.log("--------------------");

round.startVoting();

round.vote(noor)
round.vote(ahmed)
round.vote(ali)
round.vote(noor)

console.log("--------------------");

round.voteForTopic(round.topic);
