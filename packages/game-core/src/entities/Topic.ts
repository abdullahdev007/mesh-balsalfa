import { TopicCategory } from "./TopicCategory";

export class Topic {
  constructor(
    public id: string,
    public name: string,
    public category: TopicCategory
  ) {}
}
