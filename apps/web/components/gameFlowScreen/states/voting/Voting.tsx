import React from "react";
import styles from "./styles.module.scss";
import mainStyles from "../../styles.module.scss";
import TypewriterText from "@/components/Typewriter/Typewriter";

const Voting: React.FC = () => {
  
  return (
    <div className={mainStyles.container}>
      <div className={mainStyles.title}>مرحلة التصويت</div>
      <div className={mainStyles.description}>
        <TypewriterText
          text={
            "أختار بمين بتشك انو برا"
          }
          speed={10}
          isArabic={true}
          onComplete={() => setIsTypewriterComplete(true)}
        />
      </div>

      {isChooseEnabled ? (
        <div className={mainStyles.playersGrid}>
          {players.map((player) => (
            <button
              key={player.id}
              className={mainStyles.playerButton}
              onClick={() => handleAskQuestion(player.id)}
              disabled={!isTypewriterComplete || currentAskerID == player.id}
            >
              {player.username}
            </button>
          ))}
        </div>
      ) : (
        <></>
      )}

      <button
        className={`${mainStyles.nextButton} ${styles.voteButton}`}
        onClick={handleActionButton}
        disabled={!isTypewriterComplete || actionButtonLabel === "التالي"}
      >
        {actionButtonLabel}
      </button>
    </div>
  );
};

export default Voting;
