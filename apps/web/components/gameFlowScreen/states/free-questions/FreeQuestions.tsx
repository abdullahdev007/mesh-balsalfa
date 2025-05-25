import { FC, useCallback, useEffect, useRef, useState } from "react";
import mainStyles from "../../styles.module.scss";
import TypewriterText from "@/components/Typewriter/Typewriter";
import { useGame } from "@/context/GameContext";
import { GameEvent, Question } from "@repo/game-core";
import { OnlineEngineEvents } from "@/services/GameService";

const ASK_OR_VOTE = (username: string) =>
  `${username} اختر شخصًا تبي تسأله، أو اضغط على زر "بدء التصويت" إذا كنت جاهز للتصويت على اللي برا السالفة`;

const WAIT_FOR_CHOOSE = (username: string) =>
  `${username} قاعد يختار شخص، لا تسأله سؤال عن السالفة ولا تبدأ التصويت. الرجاء الانتظار`;

const QUESTION_MESSAGE = (asker: string, target: string) =>
  `${asker} اسأل ${target} سؤال متعلق بالسالفة!\nاختر سؤالًا بعناية حتى اللي برا السالفة ما يعرفون عن أيش تتكلمون`;

const QUESTION_TARGET_MESSAGE = (asker: string) =>
  `${asker} اختارك، جاوب على السؤال بطريقة ذكية ما توضح فيها إذا أنت برا السالفة أو توضح السالفة للي برا السالفة`;

const QUESTION_WAIT_MESSAGE = (asker: string, target: string) =>
  `${asker} اختار إنه يسأل ${target}. الرجاء الانتظار`;


type ActionButtonLabel = "التالي" | "بدأ التصويت" | "أكملت سوالي";
const actionButtonLabels: Record<
  "next" | "startVoting" | "completeQuestion",
  ActionButtonLabel
> = {
  next: "التالي",
  startVoting: "بدأ التصويت",
  completeQuestion: "أكملت سوالي",
};

const FreeQuestions: FC = () => {
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);
  const { online, offline, mode } = useGame();

  const [currentAskerID, setCurrentAskerID] = useState<string | null>(
    mode === "online" ? online.players[0]!.id : offline.state.players[0]!.id
  );
  const [description, setDescription] = useState<string>(
    mode === "online"
      ? online.playerID === online.players[0]!.id
        ? ASK_OR_VOTE(online.players[0]!.username)
        : WAIT_FOR_CHOOSE(online.players[0]!.username)
      : ASK_OR_VOTE(offline.state.players[0]!.username)
  );

  const [nextAskerID, setNextAskerID] = useState<string | null>(null);

  const [actionButtonLabel, setActionButtonLabel] = useState<ActionButtonLabel>(
    mode === "offline" || online.playerID === online.players[0]!.id
      ? actionButtonLabels.startVoting
      : actionButtonLabels.next
  );

  const [isChooseEnabled, setIsChooseEnabled] = useState<boolean>(
    mode === "offline" || online.playerID === online.players[0]!.id
  );

  const handleAskQuestion = useCallback(
    (targetPlayerID: string) => {
      if (mode === "online") {
        online.askFreeQuestion(targetPlayerID);
      } else if (mode === "offline") {
        offline.askFreeQuestion(currentAskerID!, targetPlayerID);
      }
    },
    [mode, online, offline, currentAskerID]
  );

  const handleActionButton = useCallback(() => {
    
    if (mode === "online") {
      if (actionButtonLabel === actionButtonLabels.startVoting) {

        online.startVoting();
      }
      else if (actionButtonLabel === actionButtonLabels.completeQuestion) {
        online.freeQuestionAskDone(nextAskerID!);
      } else console.log("somthing error");
    } else if (mode === "offline") {
      offline.startVoting();
    }
  }, [actionButtonLabel, mode, nextAskerID, online, offline]);

  useEffect(() => {
    const handleFreeQuestion = (question: Question) => {
      setIsTypewriterComplete(false);

      if (mode === "offline") {
        setCurrentAskerID(question.target.id);
        setDescription(ASK_OR_VOTE(question.target.username));
      } else if (mode === "online") {
        const askerUsername: string = question.asker.username;
        const targetUsername: string = question.target.username;
        const isCurretAsker: boolean = online.playerID === question.asker.id;

        setDescription(
          isCurretAsker
            ? QUESTION_MESSAGE(askerUsername, targetUsername)
            : online.playerID === question.target.id
              ? QUESTION_TARGET_MESSAGE(askerUsername)
              : QUESTION_WAIT_MESSAGE(askerUsername, targetUsername)
        );

        setIsChooseEnabled(false);

        setActionButtonLabel(
          isCurretAsker
            ? actionButtonLabels.completeQuestion
            : actionButtonLabels.next
        );
        setNextAskerID(question.target.id);
      }
    };

    const handleQuestionAskDone = (nextAskerID: string) => {
      const asker = online.players.find((p) => p.id === nextAskerID);
      const isCurretAsker: boolean = online.playerID === nextAskerID;

      setCurrentAskerID(nextAskerID);
      setIsChooseEnabled(isCurretAsker);

      setDescription(
        isCurretAsker
          ? ASK_OR_VOTE(asker?.username!)
          : WAIT_FOR_CHOOSE(asker?.username!)
      );
      setActionButtonLabel(
        isCurretAsker ? actionButtonLabels.startVoting : actionButtonLabels.next
      );
    };

    if (mode === "online") {
      online.on(OnlineEngineEvents.FREE_QUESTION_ASKED, handleFreeQuestion);
      online.on(
        OnlineEngineEvents.FREE_QUESTION_ASK_DONE,
        handleQuestionAskDone
      );
    } else if (mode === "offline") {
      offline.on(GameEvent.FREE_QUESTION_ASKED, handleFreeQuestion);
    }

    return () => {
      if (mode === "online") {
        online.off(OnlineEngineEvents.FREE_QUESTION_ASKED, handleFreeQuestion);
      } else if (mode === "offline") {
        offline.off(GameEvent.FREE_QUESTION_ASKED, handleFreeQuestion);
      }
    };
  }, [mode, online, offline]);

  const players = mode === "online" ? online.players : offline.state.players;

  return (
    <div className={mainStyles.container}>
      <div className={mainStyles.title}>مرحلة الاسئلة الحرة</div>
      <div className={mainStyles.description}>
        <TypewriterText
          text={description}
          speed={40}
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
        className={mainStyles.nextButton}
        onClick={handleActionButton}
        disabled={!isTypewriterComplete || actionButtonLabel === "التالي"}
      >
        {actionButtonLabel}
      </button>
    </div>
  );
};

export default FreeQuestions;
