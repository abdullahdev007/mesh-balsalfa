import { Player } from "./entities/Player";
import { Topic } from "./entities/Topic";
import { TopicCategory } from "./entities/TopicCategory";
import { Round } from "./entities/Round";

import defaultTopicsData from "./defaultTopics.json";

export class Game {
  players: Player[] = [];
  topics: Topic[] = [];
  rounds: Round[] = [];

  constructor() {
    this.initializeDefaultTopics(defaultTopicsData);
  }

  addPlayer(name: string): Player {
    const id = this.generateId();
    const player = new Player(id, name);
    this.players.push(player);
    return player;
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter((p) => p.id !== playerId);
  }

  initializeDefaultTopics(defaultTopics: {
    [key in TopicCategory]?: string[];
  }): void {
    for (const categoryKey in defaultTopics) {
      const category = categoryKey as TopicCategory;
      const topicsInCategory = defaultTopics[category];
      if (topicsInCategory) {
        for (const text of topicsInCategory) {
          const id = this.generateId();
          const topic = new Topic(id, text, category);
          this.topics.push(topic);
        }
      }
    }
  }

  addTopic(text: string, category: TopicCategory): Topic {
    const id = this.generateId();
    const topic = new Topic(id, text, category);
    this.topics.push(topic);
    return topic;
  }

  updateTopic(topicId: string, newText: string): Topic | null {
    const topic = this.topics.find((t) => t.id === topicId);
    if (topic) {
      topic.name = newText;
      return topic;
    }
    return null;
  }

  deleteTopic(topicId: string): boolean {
    const index = this.topics.findIndex((t) => t.id === topicId);
    if (index !== -1) {
      this.topics.splice(index, 1);
      return true;
    }
    return false;
  }

  startRound(): Round | null {
    if (this.players.length <= 2 || this.topics.length <= 2) {
      console.error("لا يوجد لاعبين أو سوالف تكفي.");
      return null;
    }

    const topic = this.getRandomTopic();
    const spy = this.getRandomPlayer();

    const roundId = this.generateId();
    const round = new Round(roundId, topic, spy, this.players);
    this.rounds.push(round);
    return round;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private getRandomTopic(): Topic {
    const index = Math.floor(Math.random() * this.topics.length);
    return this.topics[index]!;
  }

  private getRandomPlayer(): Player {
    const index = Math.floor(Math.random() * this.players.length);
    return this.players[index]!;
  }
}
