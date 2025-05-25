import React, { useCallback, useEffect, useRef, useState } from "react";
import mainStyles from "../../styles.module.scss";
import TypewriterText from "@/components/Typewriter/Typewriter";
import { useGame } from "@/context/GameContext";

const ONLINE_MESSAGE = (username: string) =>
  `${username} اختار الشخص اللي بتشك انه برا السالفة او اذا انت برا السالفة اختار اي حدا تصويتك ما حينحسب`;
const OFFLINE_MESSAGE = (username: string) =>
  `اعطو الجهاز ل ${username} ، اختار الشخص اللي بتشك انه برا السالفة او اذا انت برا السالفة اختار اي حدا تصويتك ما حينحسب`;

const Voting: React.FC = () => {
  const { online, offline, mode } = useGame();

  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [voterID, setVoterID] = useState<string | null>(
    mode === "online"
      ? online.playerID
      : offline.state.players[currentIndex]?.id!
  );

  const [waitCompleteVoting, setWaitCompleteVoting] = useState<boolean>(false);

  const handleVoteButton = useCallback(
    (suspectID: string) => {
      if (!voterID) return;

      setIsTypewriterComplete(false);

      if (mode === "online") {
        online.castVote(suspectID);
        setWaitCompleteVoting(true);
      } else if (mode === "offline") {
        offline.castVote(voterID, suspectID);

        const nextIndex = currentIndex + 1;

        setCurrentIndex(nextIndex);

        if (offline.state.players[nextIndex])
          setVoterID(offline.state.players[nextIndex]?.id!);
      }
    },
    [mode, online, offline, voterID, currentIndex]
  );

  const players = mode === "online" ? online.players : offline.state.players;

  return (
    <div className={mainStyles.container}>
      <div className={mainStyles.title}>مرحلة التصويت</div>
      <div className={mainStyles.description}>
        <TypewriterText
          text={
            mode === "online"
              ? ONLINE_MESSAGE(
                  online.players.find((p) => p.id === online.playerID)
                    ?.username!
                )
              : OFFLINE_MESSAGE(offline.state.players[currentIndex]?.username!)
          }
          speed={40}
          isArabic={true}
          onComplete={() => setIsTypewriterComplete(true)}
        />
      </div>

      <div className={mainStyles.playersGrid}>
        {players.map((player) => (
          <button
            key={player.id}
            className={mainStyles.playerButton}
            onClick={() => handleVoteButton(player.id)}
            disabled={
              !isTypewriterComplete ||
              voterID === player.id ||
              waitCompleteVoting
            }
          >
            {player.username}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Voting;
