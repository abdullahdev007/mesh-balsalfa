"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import { Tooltip } from "react-tooltip";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";
import AddPlayerModal from "@/components/modals/addPlayerModal/addPlayerModal";

import TopicModal from "@/components/modals/TopicModal/TopicModal";
import { useRouter } from "next/navigation";
import { GameEvent, Player, Round, TopicCategory } from "@repo/game-core";
import { useGame } from "@/context/GameContext";
import { translateCategory } from "@repo/game-core";
import { OnlineEngineEvents } from "@/services/GameService";
import toast from "react-hot-toast";
import { PlayerCard } from "@/components/PlayerCard/PlayerCard";
import { RoundCard } from "@/components/RoundCard/RoundCard";

const WaitingPage = () => {
  const router = useRouter();
  const { theme } = useTheme();

  const [tooltipText, setTooltipText] = useState("أضغط ل النسخ");
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);

  const { online, offline, cleanupOfflineGameEngine, mode } = useGame();

  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>(
    mode === "online"
      ? online.selectedCategory
      : (offline.state.selectedCategory ?? "animals"),
  );

  const [players, setPlayers] = useState<Player[]>(
    mode === "online" ? online.players : offline.state.players,
  );

  const [rounds, setRounds] = useState<Round[]>(
    mode === "online" ? online.rounds : offline.state.rounds,
  );

  useEffect(() => {
    if (mode === null) {
      router.push("/");
    }
  }, [mode, router]);

  useEffect(() => {    
    if (
      (mode !== null) && 
      (mode === "online" && online.currentPhase !== "lobby") ||
      (mode === "offline" && offline.state.phase !== "lobby")
    ) {
      router.push("/game");
    }

    const handleCategoryUpdate = (category: TopicCategory) => {
      setSelectedCategory(category);
      toast.success(`تم تحديث السالفة الى ${translateCategory(category)}`);
    };

    const handlePlayersUpdate = (players: Player[]) => setPlayers(players);

    const handleRoundStarted = () => router.push(`/game`);

    const handleError = (error: Error) => toast.error(error.message);

    const handlePlayerLeft = (player: Player) => {
      setPlayers((prevPlayers) =>
        prevPlayers.filter((p) => p.id !== player.id),
      );
    };

    const handlePlayerJoined = (player: Player) => {
      setPlayers((prevPlayers: Player[]) => {
        if (prevPlayers.some((p) => p.id === player.id)) {
          return prevPlayers;
        }
        return [...prevPlayers, player];
      });
    };

    const handleRoundsUpdate = (rounds: Round[]) => setRounds(rounds);

    if (mode === "online") {
      online.on(
        OnlineEngineEvents.TOPIC_CATEGORY_UPDATED,
        handleCategoryUpdate,
      );
      online.on(OnlineEngineEvents.PLAYERS_UPDATED, handlePlayersUpdate);
      online.on(OnlineEngineEvents.ROUND_STARTED, handleRoundStarted);
      online.on(OnlineEngineEvents.ROUNDS_UPDATED, handleRoundsUpdate);
    } else if (mode === "offline") {
      offline.on(GameEvent.CATEGORY_CHANGED, handleCategoryUpdate);
      offline.on(GameEvent.ROUND_STARTED, handleRoundStarted);
      offline.on(GameEvent.PLAYER_LEFT, handlePlayerLeft);
      offline.on(GameEvent.PLAYER_JOINED, handlePlayerJoined);
      offline.on(GameEvent.ERROR, handleError);
    }

    return () => {
      if (mode === "online") {
        online.off(
          OnlineEngineEvents.TOPIC_CATEGORY_UPDATED,
          handleCategoryUpdate,
        );
        online.off(OnlineEngineEvents.PLAYERS_UPDATED, handlePlayersUpdate);
        online.off(OnlineEngineEvents.ROUND_STARTED, handleRoundStarted);
        online.off(OnlineEngineEvents.ROUNDS_UPDATED, handleRoundsUpdate);
      } else if (mode === "offline") {
        offline.off(GameEvent.CATEGORY_CHANGED, handleCategoryUpdate);
        offline.off(GameEvent.ROUND_STARTED, handleRoundStarted);
        offline.off(GameEvent.PLAYER_LEFT, handlePlayerLeft);
        offline.off(GameEvent.PLAYER_JOINED, handlePlayerJoined);
        offline.off(GameEvent.ERROR, handleError);
      }
    };
  }, [online, offline, mode, router]);

  if (mode === null) {
    return null;
  }

  const handleOpenTopicsModal = () => setIsTopicsModalOpen(true);

  const handleCloseTopicsModal = () => setIsTopicsModalOpen(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(online.roomID ?? "");
    setTooltipText("تم النسخ");

    setTimeout(() => {
      setTooltipText("أضغط ل النسخ");
    }, 1000);
  };

  const [isStartRoundLoading, setIsStartRoundLoading] = useState(false);
  const [isLeaveGameLoading, setIsLeaveGameLoading] = useState(false);

  const handleStartRound = async () => {
    if (players.length < 3) {
      return toast.error("لا يمكن بدء الجولة بأقل من 3 لاعبين ");
    }

    if (mode === "online") {
      if (!online.isAdmin) {
        return toast.error("لا تمتتلك الصلاحية ل بدأ جولة جديدة");
      }
      setIsStartRoundLoading(true);
      try {
        await online.startRound();
      } catch (error) {
        toast.error("حدث خطأ أثناء بدء الجولة");
      } finally {
        setIsStartRoundLoading(false);
      }
    } else if (mode === "offline") {
      setIsStartRoundLoading(true);
      try {
        await offline.startNewRound();
      } catch (error) {
        toast.error("حدث خطأ أثناء بدء الجولة");
      } finally {
        setIsStartRoundLoading(false);
      }
    }
  };

  const handleLeaveGame = async () => {
    setIsLeaveGameLoading(true);
    try {
      if (mode === "online") {
        await online.leaveRoom();
      } else if (mode === "offline") {
        await cleanupOfflineGameEngine();
      }
      router.push("/");
    } catch (error) {
      toast.error("حدث خطأ أثناء مغادرة الغرفة");
      setIsLeaveGameLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        {mode == "online" ? (
          <div className={styles.roomID}>
            <span className={styles.title}>معرف الغرفة</span>
            <span
              className={styles.id}
              data-tooltip-id="roomID-tooltip"
              data-tooltip-content={tooltipText}
              onClick={handleCopy}
            >
              {online?.roomID}
            </span>

            <Tooltip id="roomID-tooltip" style={{ fontSize: "15px" }} />
          </div>
        ) : (
          <></>
        )}

        <div
          className={styles.topicSelect}
          style={{
            backgroundImage: `url("/images/topics/${selectedCategory ?? "animals"}.png")`,
          }}
        >
          <span>{translateCategory(selectedCategory) ?? selectedCategory}</span>

          <button
            className={styles.updateTopic}
            onClick={handleOpenTopicsModal}
          >
            حدث السوالف او اختار سالفة جديدة
          </button>

          <TopicModal
            isOpen={isTopicsModalOpen}
            onClose={handleCloseTopicsModal}
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.logoHolder}>
          <Image
            src={`/images/${theme === "dark" ? "light-logo.png" : "dark-logo.png"}`}
            alt="game logo"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className={styles.listsFlex}>
          <div
            className={`${styles.playersList} ${styles.table} ${theme == "dark" ? styles.dark : ""}`}
          >
            <span className={styles.title}>اللاعبين</span>

            {mode === "offline" && players.length === 0 ? (
              <div className={styles.noPlayerYet}>
                {" "}
                <span>لم تضف اي لاعب بعد</span>
              </div>
            ) : (
              <ul>
                {players?.map((player, index) => (
                  <PlayerCard key={player.id} player={player} index={index} />
                ))}
              </ul>
            )}

            {mode == "offline" ? (
              <>
                <div
                  className={styles.addPlayer}
                  onClick={() => setIsAddPlayerModalOpen(true)}
                >
                  أضف لاعب جديد
                </div>
                <AddPlayerModal
                  isOpen={isAddPlayerModalOpen}
                  onClose={() => setIsAddPlayerModalOpen(false)}
                />
              </>
            ) : (
              <></>
            )}
          </div>

          <div
            className={`${styles.roundHistory} ${styles.table} ${theme == "dark" ? styles.dark : ""}`}
          >
            <span className={styles.title}>الجولات</span>
            <div className={styles.roundLists}>
              {rounds.length === 0 ? (
                <div className={styles.noRoundYet}>
                  {" "}
                  <span>لا يوجد اي جولة تم لعبها بعد</span>
                </div>
              ) : (
                rounds.map((round) => (
                  <RoundCard
                    key={round.roundNumber}
                    round={round}
                    players={players}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.buttonsGroup}>
          {(mode === "offline" || (mode === "online" && online.isAdmin)) && (
            <span
              className={`${styles.startRound} ${isStartRoundLoading ? styles.disabled : ""}`}
              onClick={!isStartRoundLoading ? handleStartRound : undefined}
            >
              {isStartRoundLoading ? "جاري بدء الجولة..." : "بدء الجولة"}
            </span>
          )}
          <span
            className={`${styles.leaveGame} ${mode === "online" && !online.isAdmin ? styles.singleButton : ""} ${isLeaveGameLoading ? styles.disabled : ""}`}
            onClick={!isLeaveGameLoading ? handleLeaveGame : undefined}
          >
            {isLeaveGameLoading
              ? "جاري المغادرة..."
              : mode === "online"
                ? "ترك الغرفة"
                : "انهاء اللعبة"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WaitingPage;
