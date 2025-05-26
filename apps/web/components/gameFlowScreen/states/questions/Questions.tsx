import { FC, useCallback, useEffect, useRef, useState } from "react";
import mainStyles from "../../styles.module.scss";
import TypewriterText from "@/components/Typewriter/Typewriter";
import { useGame } from "@/context/GameContext";
import { GameEvent, Question } from "@repo/game-core";
import { OnlineEngineEvents } from "@/services/GameService";
import { useCountdown } from "@/hooks/useCountdown";
import toast from "react-hot-toast";

// Message constants
const INITIAL_OFFLINE_MESSAGE =
  "كل شخص راح يسأل شخص ثاني سؤال متعلق بالسالفة اضغط على التالي حتى تعرفون مين رح يسائل مين";
const INITIAL_ONLINE_MESSAGE = "كل شخص راح يسأل شخص ثاني سؤال متعلق بلسالفة...";
const TIMER_MESSAGE = (seconds: number) =>
  `ستبدأ مرحلة الأسئلة بعد ${seconds} ثانية`;
const QUESTION_MESSAGE = (asker: string, target: string) =>
  `${asker} اسأل ${target} سؤال متعلق بلسالفة !\n      اختار سؤال بعناية حتى اللي برا السالفة ما يعرف عن ايش تتكلمون`;

const Questions: FC = () => {
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);
  const { online, offline, mode } = useGame();
  const [description, setDescription] = useState<string>(
    mode === "online" ? INITIAL_ONLINE_MESSAGE : INITIAL_OFFLINE_MESSAGE,
  );
  const [askerID, setAskerID] = useState<string | null>(null);

  const toastIdRef = useRef<string | undefined>(undefined);

  const { timeLeft } = useCountdown({
    duration: mode === "online" ? 7 : 0,
    onComplete: () => {
      if (mode === "online") {
        toast.dismiss(toastIdRef.current);
        if (online.isAdmin) nextQuestion();
      }
    },
  });

  useEffect(() => {
    if (timeLeft > 0) {
      toastIdRef.current = toast(TIMER_MESSAGE(timeLeft), {
        id: "countdown-toast",
      });
    }
  }, [timeLeft]);

  const nextQuestion = useCallback(() => {
    if (mode === "online") {
      online.askNextQuestion();
    } else if (mode === "offline") {
      offline.askNextQuestion();
    }
  }, []);

  useEffect(() => {
    const handleNewQuestion = (question: Question) => {
      setIsTypewriterComplete(false);

      if (question) {
        setAskerID(question.asker.id);

        setDescription(
          QUESTION_MESSAGE(question.asker.username, question.target.username),
        );
      }
    };

    if (mode === "online") {
      online.on(OnlineEngineEvents.NEW_QUESTION, handleNewQuestion);
    } else if (mode === "offline") {
      offline.on(GameEvent.QUESTION_ASKED, handleNewQuestion);
    }

    return () => {
      if (mode === "online") {
        online.off(OnlineEngineEvents.NEW_QUESTION, handleNewQuestion);
      } else if (mode === "offline") {
        offline.off(GameEvent.QUESTION_ASKED, handleNewQuestion);
      }
    };
  }, [mode, offline, online]);

  return (
    <div className={mainStyles.container}>
      <div className={mainStyles.title}> مرحلة الاسئلة </div>
      <div className={mainStyles.description}>
        <TypewriterText
          text={description}
          speed={40}
          isArabic={true}
          onComplete={() => setIsTypewriterComplete(true)}
        />
      </div>
      <button
        className={`${mainStyles.nextButton}`}
        disabled={
          !isTypewriterComplete ||
          (mode == "online" && askerID !== online?.playerID)
        }
        onClick={() => nextQuestion()}
      >
        التالي
      </button>
    </div>
  );
};

export default Questions;
