export interface Topic {
  id: string;
  category: TopicCategory;
  name: string;
}

export type TopicCategory = 
  | 'foods'
  | 'clothes'
  | 'places'
  | "transportation"
  | "professions"
  | "youtubers"
  | 'animals'
  | "cartoons"
  | "characters"
  | "series"
  | "cars";