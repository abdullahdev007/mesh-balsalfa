import { TopicCategory } from "@repo/game-core";
import { useState, useEffect } from "react";
import { OnlineGameSystem } from "../services/GameService/OnlineGameSystem";
import styles from "../styles/CategorySelector.module.css";

interface CategorySelectorProps {
  gameSystem: OnlineGameSystem;
  onCategoryChange?: (category: TopicCategory) => void;
}

export const CategorySelector = ({
  gameSystem,
  onCategoryChange,
}: CategorySelectorProps) => {
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    TopicCategory | undefined
  >();

  useEffect(() => {
    // Get initial categories
    setCategories(gameSystem.getCategories());
    setSelectedCategory(gameSystem.getSelectedCategory());

    // Listen for category updates
    const handleCategoryUpdate = (category: TopicCategory) => {
      setSelectedCategory(category);
      onCategoryChange?.(category);
    };

    gameSystem.on("topics:category_updated", handleCategoryUpdate);

    return () => {
      gameSystem.off("topics:category_updated", handleCategoryUpdate);
    };
  }, [gameSystem, onCategoryChange]);

  const handleCategorySelect = async (category: TopicCategory) => {
    try {
      await gameSystem.updateTopicCategory(category);
      setSelectedCategory(category);
      onCategoryChange?.(category);
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  return (
    <div className={styles.categorySelector}>
      <h3>Select Category</h3>
      <div className={styles.categoryButtons}>
        {categories.map((category) => (
          <button
            key={category}
            className={`${styles.categoryButton} ${selectedCategory === category ? styles.selected : ""}`}
            onClick={() => handleCategorySelect(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};
