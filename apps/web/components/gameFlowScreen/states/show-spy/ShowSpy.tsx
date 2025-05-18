import React, { useEffect, useState } from "react";
import mainStyles from "../../styles.module.scss";
import TypewriterText from "@/components/Typewriter/Typewriter";
import { useGame } from "@/context/GameContext";
import { GameEvent, VoteResult } from "@repo/game-core";
import styles from "./styles.module.scss";
import { useCountdown } from "@/hooks/useCountdown";
import toast from "react-hot-toast";

const ShowSpy: React.FC = () => {
  const [isFirstTypewriterComplete, setIsFirstTypewriterComplete] = useState(false);
  const [isSecondTypewriterComplete, setIsSecondTypewriterComplete] = useState(false);
  const { online, offline, mode } = useGame();

  const { timeLeft, start: startTimer } = useCountdown({
    duration: 5,
    autoStart: false,
    onComplete: () => {
      if (mode === "online") {
        if(online.isAdmin) online.startGuessTopic();
      } else {
        offline.emit(GameEvent.PHASE_CHANGED, "guess-topic");
      }
    },
  });

  useEffect(() => {
    if (isSecondTypewriterComplete) startTimer();
  }, [isSecondTypewriterComplete]);

  // Show countdown toast when typewriter is complete
  React.useEffect(() => {
    
    if (isFirstTypewriterComplete && timeLeft > 0) {
      toast.loading(`الانتقال إلى المرحلة التالية خلال ${timeLeft} ثواني`, {
        id: "phase-transition",
        duration: 1000,
      });
    }
  }, [isFirstTypewriterComplete, timeLeft]);

  const currentRound =
    mode === "online" ? online.currentRound : offline.getCurrentRound;
  const spy = currentRound?.spy;

  if (!spy) return null;

  const votes: VoteResult[] = currentRound?.votes!;
  
  const correctVoteNumbers = votes.filter(
    (v: VoteResult) => v.voterID !== spy.id && v.suspectID === spy.id
  ).length;

  const allPlayersGuessedSpy = correctVoteNumbers === (currentRound?.players.length! - 1);
  const allPlayersDontGuessedSpy = correctVoteNumbers === 0;



  const messages = votes
    .filter((vote: VoteResult) => vote.voterID !== spy.id && vote.suspectID === spy.id)
    .map((vote: VoteResult) => {
      const voter =
        mode === "online"
          ? online.players.find((p) => p.id === vote.voterID)
          : offline.state.players.find((p) => p.id === vote.voterID);

      const suspect =
        mode === "online"
          ? online.players.find((p) => p.id === vote.suspectID)
          : offline.state.players.find((p) => p.id === vote.suspectID);

      const score =
        currentRound.scores.find((s) => s.playerID === vote.voterID)
          ?.score || 0;

      return {
        message: `${voter?.username} صوت على ${suspect?.username}`,
        score: `${score > 0 ? "+" : ""} ${score} نقاط`,
        positive: score > 0,
      };
    });

  if(allPlayersGuessedSpy) {
    messages.push({
      message: `جميع الي بلسالفة اكتشفو الجاسوس`,
      score: `-5 نقاط للجساسوس`,
      positive: false,
    })
  } else if(allPlayersDontGuessedSpy) {
    messages.push({
      message: `جميع الي بلسالفة لم يكتشفو الجاسوس`,
      score: `+5 نقاط للجساسوس`,
      positive: true,
    })
  }   

  return (
    <div className={mainStyles.container}>
      <div className={mainStyles.title}>مرحلة التصويت</div>
      <div className={mainStyles.description}>
        <TypewriterText
          text={`الي برا السالفة هو ${spy.username} !!`}
          speed={50}
          isArabic={true}
          onComplete={() => setIsFirstTypewriterComplete(true)}
        />
        {isFirstTypewriterComplete && (
            <TypewriterText
              text={`${correctVoteNumbers} اشخاص صوت صح`}
              speed={50}
              isArabic={true}
              onComplete={() => setIsSecondTypewriterComplete(true)}
            />
        )}
      </div>

      <div className={styles.votesContainer}>
        <ul className={styles.votes}>
          {isFirstTypewriterComplete &&
            messages.map((message, index: number) => {
              return (
                <li
                  key={index}
                  className={styles.voteItem}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <span>{message?.message}                  </span>
                  <strong
                    style={{
                      background: message?.positive ? "green" : "red",
                    }}
                  >
                    {message?.score}
                  </strong>
                </li>
              );
            })}
        </ul>
      </div>
      
    </div>
  );
};

export default ShowSpy;
