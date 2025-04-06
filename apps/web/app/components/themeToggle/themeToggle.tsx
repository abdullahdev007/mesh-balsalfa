"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext"; 
import styles from "./styles.module.scss";

const ThemeToggle = () => {
  const themeContext = useTheme(); 

  
  if (!themeContext) {
    return null; 
  }

  const { theme, toggleTheme } = themeContext;

  return (
    <div className={styles.themeToggle}>
      <input
        type="checkbox"
        className={styles.themeCheckbox}
        checked={theme === "dark"} // Bind to theme state
        onChange={toggleTheme} // Toggle theme on change
      />
    </div>
  );
};

export default ThemeToggle;
