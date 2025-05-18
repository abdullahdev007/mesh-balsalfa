import React, {  useState } from "react";
import mainStyles from "../../styles.module.scss";
import { useGame } from "@/context/GameContext";
import TypewriterText from "@/components/Typewriter/Typewriter";

const SPY_DESCRIPTION =
  "انت خارج السالفة ركز على انك تعرف ايش هي السالفة بدون ما توضح ل الي جوا السالفة";
const INTOPIC_DESCRIPTION = (topic: string) =>
  `انت داخل السالفة ولي هي "${topic}" حاول اعرف مين الي برا السالفة بدون ما توضحله السالفة`;
const PASS_DEVICE_MESSAGE = (playerName: string) =>
  `اعطو التلفون ل ${playerName}`;

const RoleAssignment: React.FC = () => {
  const { online, offline, mode } = useGame();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showingRole, setShowingRole] = useState(false);
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);
  const [roleTaked, setRoleTaked] = useState(false);

  if (mode === "online") {
    const handleRoleUnderstand = () => {
      online.roleTaked();
      setRoleTaked(true);
    };

    return (
      <div className={mainStyles.container}>
        <div className={mainStyles.title}>أعرف دورك</div>
        <div className={mainStyles.description}>
          <TypewriterText
            text={
              online?.currentRound?.spy.id === online.playerID
                ? SPY_DESCRIPTION
                : INTOPIC_DESCRIPTION(
                    online?.currentRound?.topic?.name || "No Topic"
                  )
            }
            speed={1}
            isArabic={true}
            onComplete={() => setIsTypewriterComplete(true)}
          />
        </div>
        <button
          className={`${mainStyles.nextButton} ${!isTypewriterComplete ? mainStyles.disabled : ""}`}
          onClick={handleRoleUnderstand}
          disabled={!isTypewriterComplete || roleTaked}
        >
          فهمت ايش دوري
        </button>
      </div>
    );
  }

  const handleNextStep = () => {
    setIsTypewriterComplete(false);
    setShowingRole((prev) => !prev);

    if (showingRole && currentPlayerIndex < offline.state.players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else if (
      showingRole &&
      currentPlayerIndex === offline.state.players.length - 1
    ) {
      offline.startQuestionPhase();
    }
  };

  const currentPlayer = offline.state.players[currentPlayerIndex];
  const isSpy = currentPlayer?.role === "Spy";
  const topic = offline.getCurrentRound?.topic?.name || "No Topic";


  const getCurrentText = () => {
    
    if (!showingRole) {
      return PASS_DEVICE_MESSAGE(currentPlayer?.username || "");
    }
    return isSpy ? SPY_DESCRIPTION : INTOPIC_DESCRIPTION(topic);
  };

  return (
    <div className={mainStyles.container}>
      <div className={mainStyles.title}>توزيع الادوار</div>
      <div className={mainStyles.description}>
        <TypewriterText
          key={`${currentPlayerIndex}-${showingRole}`} 
          text={getCurrentText()}
          speed={1}
          isArabic={true}
          onComplete={() => setIsTypewriterComplete(true)}
        />
      </div>
      <button
        className={`${mainStyles.nextButton} ${!isTypewriterComplete ? mainStyles.disabled : ""}`}
        onClick={handleNextStep}
        disabled={!isTypewriterComplete}
      >
        {showingRole ? "التالي" : "اظهار الدور"}
      </button>
    </div>
  );
};

export default RoleAssignment;
