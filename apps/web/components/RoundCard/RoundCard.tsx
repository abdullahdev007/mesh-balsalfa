import React from "react";
import styles from "./styles.module.scss";
import { Round, Player, translateCategory } from "@repo/game-core";

interface RoundCardProps {
  round: Round;
  players: Player[];
}

export const RoundCard: React.FC<RoundCardProps> = ({ round, players }) => {
  return (
    <div className={styles.round}>
      <span className={styles.roundNumber}>{round.roundNumber}</span>
      <div className={styles.topic}>
        <strong>السالفة : </strong>
        <span>{`${translateCategory(round.topicCategory)}/${round.topic.name}`}</span>
      </div>
      <div className={styles.spy}>
        <strong>الجاسوس : </strong>
        <span>{round.spy.username}</span>
      </div>
      <div className={styles.guessedTopic}>
        <strong>السالفة المتوقعة من الجاسوس : </strong>
        <span>{round.guessedTopic?.name}</span>
      </div>
      <div className={styles.votes}>
        <strong>الاصوات :</strong>
        <div>
          {Object.entries(round.votes).map(([string, voteResult]) => (
            <span key={string} className={styles.vote}>
              {`${round.players.find((p) => p.id == voteResult.voterID)?.username} -> ${round.players.find((p) => p.id == voteResult.suspectID)?.username}`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
