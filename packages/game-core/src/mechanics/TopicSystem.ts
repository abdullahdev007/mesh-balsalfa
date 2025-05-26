import { Topic, TopicCategory } from "../models/Topic.js";
import defaultTopics from "../defaultTopics.js";

export class TopicManager {
  public topics: Topic[];

  constructor() {
    this.topics = this.loadDefaultTopics();
  }

  private loadDefaultTopics(): Topic[] {
    let id = 1;
    const topics: Topic[] = [];

    for (const [category, items] of Object.entries(defaultTopics)) {
      for (const item of items) {
        topics.push({
          id: id.toString(),
          category: category as TopicCategory,
          name: item,
        });
        id++;
      }
    }

    return topics;
  }

  addTopic(topic: Omit<Topic, "id">): void {
    const lastId =
      this.topics.length > 0
        ? parseInt(this.topics[this.topics.length - 1]!.id, 10)
        : 0;

    const newId = (lastId + 1).toString();

    const newTopic = { ...topic, id: newId };
    this.topics.push(newTopic);
  }

  removeTopic(topicID: string): void {
    this.topics = this.topics.filter((topic: Topic) => topic.id !== topicID);
  }

  updateTopic(updatedTopic: Topic): void {
    const topicIndex = this.topics.findIndex(
      (topic) => topic.id === updatedTopic.id,
    );

    if (topicIndex !== -1) {
      this.topics[topicIndex] = { ...this.topics[topicIndex], ...updatedTopic };
    } else {
      console.error("Topic not found with ID:", updatedTopic.id);
    }
  }

  resetTopics(): void {
    this.topics = this.loadDefaultTopics();
  }

  getRandomTopic(category?: TopicCategory): Topic {
    const filtered = category
      ? this.topics.filter((t) => t.category === category)
      : this.topics;

    return filtered[Math.floor(Math.random() * filtered.length)]!;
  }

  getGuessList(correctTopic: Topic, topicCategory: TopicCategory): Topic[] {
    const guessList: Topic[] = [];
    const correctIndex = Math.floor(Math.random() * (7 - 0 + 1)) + 0;

    for (let i = 0; i < 7; i++) {
      guessList.push(
        i === correctIndex ? correctTopic : this.getRandomTopic(topicCategory),
      );
    }

    return guessList;
  }

  getCategories(): TopicCategory[] {
    return [...new Set(this.topics.map((t) => t.category))];
  }

  getTopics = (category?: TopicCategory): Topic[] =>
    category
      ? this.topics.filter((topic: Topic) => topic.category === category)
      : this.topics;

  getTopic = (topicID: string): Topic =>
    this.topics.find((topic: Topic) => topic.id === topicID)!;
}
