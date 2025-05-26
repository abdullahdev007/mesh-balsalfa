import React, { useState } from "react";
import styles from "./styles.module.scss";
import { FaTrash } from "react-icons/fa";
import { useGame } from "@/context/GameContext";
import { Player } from "@repo/game-core";

interface PlayerCardProps {
  player: Player;
  index: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, index }) => {
  const { mode, online, offline } = useGame();
  const [score, setScore] = useState(player.score || 0);

  const handleDeletePlayer = () => {
    if (mode === "offline") {
      offline.removePlayer(player.id);
    } else if (mode === "online" && online.isAdmin) {
      online.kickPlayer(player.id);
    }
  };

  const showDeleteButton =
    mode === "offline" ||
    (mode === "online" && online.isAdmin && online.playerID !== player.id);

  return (
    <div className={styles.playerCard}>
      <div className={styles.playerInfo}>
        <span className={styles.playerNumber}>{index + 1}</span>
        <h3 className={styles.playerName}>{player.username}</h3>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.score}>النقاط: {score}</span>
        {showDeleteButton && (
          <button
            className={styles.deleteButton}
            onClick={handleDeletePlayer}
            aria-label="Delete player"
          >
            <FaTrash />
          </button>
        )}
      </div>
    </div>
  );
};
