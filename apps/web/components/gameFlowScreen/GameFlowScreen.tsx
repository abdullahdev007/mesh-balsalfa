import React from "react";
import { useGame } from "@/context/GameContext";
import styles from "./styles.module.scss";
import { useTheme } from "@/context/ThemeContext";
import { GamePhase } from "@repo/game-core";
import {
  RoleAssignment,
  Questions,
  FreeQuestions,
  ShowSpy,
  Voting,
  GuessTopic,
} from "./states";

export type GameScreenType = GamePhase;

interface GameFlowScreenProps {
  currentScreen: GameScreenType;
}

const GameFlowScreen: React.FC<GameFlowScreenProps> = ({ currentScreen }) => {
  const { theme } = useTheme();


  const renderScreen = () => {
    switch (currentScreen) {

      case "role-assignment":
        return <RoleAssignment />;
      case "questions-phase":
        return <Questions />;
      case "free-questions-phase":
        return <FreeQuestions />;
      case "show-spy":
        return <ShowSpy />;
      case "voting":
        return <Voting />;
      case "guess-topic":
        return <GuessTopic />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`${styles.gameFlowScreen} ${theme === "dark" ? styles.dark : ""}`}
    >
      {renderScreen()}
    </div>
  );
};

export default GameFlowScreen;
