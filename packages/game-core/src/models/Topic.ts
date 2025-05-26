export interface Topic {
  id: string;
  category: TopicCategory;
  name: string;
}

export type TopicCategory =
  | "foods"
  | "clothes"
  | "places"
  | "transportation"
  | "professions"
  | "youtubers"
  | "animals"
  | "cartoons"
  | "characters"
  | "series"
  | "cars";

export const CategoryTranslations = {
  foods: "أطعمة",
  clothes: "ملابس",
  places: "أماكن",
  transportation: "مواصلات",
  professions: "مهن",
  youtubers: "يوتيوبرز",
  animals: "حيوانات",
  cartoons: "رسوم متحركة",
  characters: "شخصيات",
  series: "مسلسلات",
  cars: "سيارات",
};
