import { CategoryTranslations, TopicCategory } from "../models";

export function translateCategory(category: TopicCategory): string {
  return CategoryTranslations[category] || category; // Default to the key if translation is not found
}
