// app/page.tsx

"use client";

import Image from "next/image";

import styles from "./page.module.scss";
import { useTheme } from "./context/ThemeContext";
import {  useState } from "react";

import MainPanel from "./components/panels/main-panel/mainPanel";

export enum Panel {
  MAIN,
  CREATE_LOCAL_GAME,
  GAME_SCREEN,
}

const Home = () => {
  const { theme } = useTheme();
  const [activePanel, setActivePanel] = useState<Panel>(Panel.MAIN);



  return (
    <div className={styles.container}>
      <div className={styles.logoHolder}>
        <Image
          src={`/images/${theme === "dark" ? "light-logo.png" : "dark-logo.png"}`}
          alt="game logo"
          fill
          priority 
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <div className={styles.panel}>
        {activePanel === Panel.MAIN && <MainPanel setActivePanel={setActivePanel} />}
    
      </div>
    </div>
  );
};

export default Home;
