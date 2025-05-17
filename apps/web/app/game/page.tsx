"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import styles from "./page.module.scss";
import GameFlowScreen from "@/components/gameFlowScreen/GameFlowScreen";
import { useGame } from "@/context/GameContext";
import { useRouter } from "next/navigation";
import { GameEvent, GamePhase } from "@repo/game-core";
import { OnlineEngineEvents } from "@/services/GameService";
import type { GameScreenType } from "@/components/gameFlowScreen/GameFlowScreen";

export default function GamePage() {
  const router = useRouter();
  const { mode, offline, online } = useGame();
  const { theme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<GameScreenType>("role-assignment");

  useEffect(() => {
    if (mode === null) {
      router.push("/");
    }
  }, [router, mode]);

  useEffect(() => {
    const handlePhaseChange = (phase: GamePhase) => {
     setCurrentScreen(phase);
    };


    if (mode === "offline") {
      offline.on(GameEvent.PHASE_CHANGED, handlePhaseChange);
    } else if (mode === "online") {
      online.on(OnlineEngineEvents.PHASE_CHANGED, handlePhaseChange);
    }

    return () => {
      if (mode === "online") {
        online.off(OnlineEngineEvents.PHASE_CHANGED, handlePhaseChange);
      } else if (mode === "offline") {
        offline.off(GameEvent.PHASE_CHANGED, handlePhaseChange);
      }
    };
  }, [offline, mode, online]);

  return (
    <div className={styles.gamePage}>
      <div className={styles.logoHolder}>
        <Image
          src={`/images/${theme === "dark" ? "light-logo.png" : "dark-logo.png"}`}
          alt="game logo"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <div className={styles.gameContainer}>
        <GameFlowScreen currentScreen={currentScreen} />
      </div>
    </div>
  );
}
