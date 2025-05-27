import React, { useEffect, useState } from "react";
import mainStyles from "../../styles.module.scss";
import TypewriterText from "@/components/Typewriter/Typewriter";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import styles from "./styles.module.scss";
import { OnlineEngineEvents } from "@/services/GameService";
import { GameEvent, Topic } from "@repo/game-core";
import { useCountdown } from "@/hooks/useCountdown";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ScoreMessage {
  message: string;
  score: string;
  positive: boolean;
}

const GuessTopic: React.FC = () => {
  const [isFirstTypewriterComplete, setIsFirstTypewriterComplete] =
    React.useState(false);
  const [isTopicGuessed, setIsTopicGuessed] = useState(false);
  const [scoreMessages, setScoreMessages] = useState<ScoreMessage[]>([]);
  const { mode, online, offline } = useGame();
  const { theme } = useTheme();
  const router = useRouter();

  const { timeLeft, start: startTimer } = useCountdown({
    duration: 7,
    autoStart: false,
    onComplete: () => {
      if (mode === "offline") offline.endRound();
      else if (mode === "online" && online.isAdmin) online.endRound();
    },
  });

  useEffect(() => {
    if (isTopicGuessed) startTimer();
  }, [isTopicGuessed]);

  // Show countdown toast when topic is guessed
  useEffect(() => {
    if (isTopicGuessed && timeLeft > 0) {
      toast.loading(`انهاء الجولة الحالية خلال ${timeLeft} ثواني`, {
        id: "phase-transition",
        duration: 1000,
      });
    }
  }, [timeLeft, isTopicGuessed]);

  const currentRound =
    mode === "online" ? online.currentRound : offline.getCurrentRound;
  const guessList = currentRound?.guessList;
  const spy = currentRound?.spy!;
  const spyUsername = spy?.username || "";
  const isSpyPlayer =
    mode === "online" ? online.playerID === currentRound?.spy?.id : true;

  useEffect(() => {
    const TOPIC_GUESSED = (data: {
      guessedTopic: Topic;
      correctTopic: Topic;
    }) => {
      setIsTopicGuessed(true);
      const { guessedTopic, correctTopic } = data;
      const messages: ScoreMessage[] = [];
      if (guessedTopic?.id === correctTopic?.id) {
        messages.push({
          message: `الجاسوس توقع السالفة صح!`,
          score: "+10 نقاط",
          positive: true,
        });
      }

      setScoreMessages(messages);
    };

    if (mode === "online") {
      online.on(OnlineEngineEvents.TOPIC_GUESSED, TOPIC_GUESSED);
    } else if (mode === "offline") {
      offline.on(GameEvent.TOPIC_GUESSED, TOPIC_GUESSED);
    }

    return () => {
      if (mode === "online") {
        online.off(OnlineEngineEvents.TOPIC_GUESSED, TOPIC_GUESSED);
      } else {
        offline.off(GameEvent.TOPIC_GUESSED, TOPIC_GUESSED);
      }
    };
  }, [mode, online, offline, currentRound, router]);

  const description = () => {
    if (isTopicGuessed) {
      const guessedTopic = currentRound?.guessedTopic;
      const correctTopic = currentRound?.topic;
      const isCorrectGuess = guessedTopic?.id === correctTopic?.id;

      if (mode === "offline") {
        return isCorrectGuess
          ? `توقعك صح السالفة هي ${correctTopic?.name}`
          : `توقعك غلط السالفة هي ${correctTopic?.name}`;
      } else {
        // Online mode
        return isSpyPlayer
          ? `توقعك ${isCorrectGuess ? "صح" : "غلط"} السالفة هي ${correctTopic?.name}`
          : `${spyUsername} توقع السالفة ${isCorrectGuess ? `صح الي هي ${correctTopic?.name}` : `غلط توقع ${guessedTopic?.name}`}`;
      }
    }

    // Initial description before guessing
    return isSpyPlayer
      ? `${spyUsername} ايش هي السالفة`
      : `الرجاء الانتظار ل ينتهي ${spyUsername} من توقع السالفة`;
  };

  const handleGuess = async (topicID: string) => {
    if (!isSpyPlayer) return;

    if (mode === "online") {
      await online.guessTopic(topicID);
    } else {
      offline.guessTopic(topicID, spy.id);
    }
  };

  return (
    <div className={mainStyles.container}>
      <div className={mainStyles.title}>توقع السالفة</div>

      <TypewriterText
        text={description()}
        isArabic={true}
        speed={25}
        className={styles.description}
        onComplete={() => setIsFirstTypewriterComplete(true)}
      />

      {guessList && !isTopicGuessed && isSpyPlayer && (
        <div
          className={`${styles.topicsContainer} ${theme === "dark" ? styles.dark : ""} ${isTopicGuessed ? styles.fadeOut : ""}`}
        >
          {guessList.map((topic, index) => (
            <button
              key={index}
              className={`${styles.topicButton} ${!isFirstTypewriterComplete || !isSpyPlayer ? styles.inactive : ""}`}
              onClick={() => handleGuess(topic.id)}
              disabled={!isSpyPlayer}
            >
              {topic.name}
            </button>
          ))}
        </div>
      )}

      {isTopicGuessed && scoreMessages.length >= 1 && (
        <div className={styles.messagesContainer}>
          {scoreMessages.map((message, index) => (
            <div
              key={index}
              className={styles.messageItem}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <span>{message.message}</span>
              <strong
                className={message.positive ? styles.positive : styles.negative}
              >
                {message.score}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuessTopic;
