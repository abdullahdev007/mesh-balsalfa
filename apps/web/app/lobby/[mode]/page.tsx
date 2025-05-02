"use client";

import React, { use, useEffect, useState } from "react";
import styles from "../styles.module.scss";
import { Tooltip } from "react-tooltip";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";
import AddPlayerModal from "@/components/modals/addPlayerModal/addPlayerModal";

import TopicModal from "@/components/modals/TopicModal/TopicModal";
import { useRouter } from "next/navigation";
import {  GameEvent, Round, TopicCategory } from "@repo/game-core";
import { useGame } from "@/context/GameContext";
import { translateCategory } from "@repo/game-core";
import { OnlineEngineEvents } from "@/services/GameService";

const WaitingPage = ({ params }: { params: Promise<{ mode: string }> }) => {
  const { mode } = use(params);
  const router = useRouter();
  const { theme } = useTheme();

  const [tooltipText, setTooltipText] = useState("أضغط ل النسخ");
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);

  const { online, offline, cleanupOfflineGameEngine } = useGame();


  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>(
    mode === "online"
      ? online.selectedCategory
      : (offline.state.selectedCategory ?? "animals")
  );

  const [players, setPlayers] = useState<{ id: string; username: string }[]>(
    mode === "online" ? online.players : offline.state.players
  );

  const [rounds, setRounds] = useState<Round[]>([]);

  useEffect(() => {
    if (mode !== "online" && mode !== "offline") {
      router.push("/");
    }
    if (mode === "online" && !online.roomID) {
      router.push("/");
    }
  }, [mode, router, online.roomID]);

  useEffect(() => {
    const handleCategoryUpdate = (category: TopicCategory) => {
      setSelectedCategory(category);
    };

    const handlePlayersUpdate = (
      players: { id: string; username: string }[]
    ) => {
      setPlayers([...players]);
    };

    
    if (mode === "online") {
      online.on(OnlineEngineEvents.TOPIC_CATEGORY_UPDATED, handleCategoryUpdate);
      online.on(OnlineEngineEvents.PLAYERS_UPDATED, handlePlayersUpdate);
    } else if (mode === "offline") {  
      offline.on(GameEvent.CATEGORY_CHANGED, handleCategoryUpdate);
    }

    return () => {
      if (mode === "online") {
        online.off(
          OnlineEngineEvents.TOPIC_CATEGORY_UPDATED,
        handleCategoryUpdate
      );
      online.off(OnlineEngineEvents.PLAYERS_UPDATED, handlePlayersUpdate);
      } else if (mode === "offline") {
        offline.off(GameEvent.CATEGORY_CHANGED, handleCategoryUpdate);
      }
    };
  }, [online,offline,mode]);

  useEffect(() => {

    const handleCategoryUpdate = (category: TopicCategory) => {
      setSelectedCategory(category);
    };

    return () => {
      if (mode === "offline") {
        offline.off(GameEvent.CATEGORY_CHANGED, handleCategoryUpdate);
      }
    };
  }, [offline]);

  if (mode !== "online" && mode !== "offline") {
    return null;
  }

  const handleOpenTopicsModal = () => {
    setIsTopicsModalOpen(true);
  };

  const handleCloseTopicsModal = () => {
    setIsTopicsModalOpen(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(online.roomID ?? "");
    setTooltipText("تم النسخ");

    setTimeout(() => {
      setTooltipText("أضغط ل النسخ");
    }, 1000);
  };

  const handleLeaveGame = () => {
    router.back();
    if (mode === "online") {
      online.leaveRoom();
    } else if (mode === "offline") {
      cleanupOfflineGameEngine();
    }
  };

  const handleStartRound = () => {};

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
                  <li key={player.id}>{`${index++}. ${player.username}`}</li>
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
                  <div className={styles.round} key={round.roundNumber}>
                    <div className={styles.roundNumber}>
                      <strong>رقم الجولة : </strong>
                      <span>{round.roundNumber}</span>
                    </div>
                    <div className={styles.topic}>
                      <strong>السالفة : </strong>
                      <span>{`${round.topicCategory}/${round.topic}`}</span>
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
                        {Object.entries(round.votes).map(
                          ([string, voteResult]) => (
                            <span key={string} className={styles.vote}>
                              {`${players.find((p) => p.id == voteResult.voterID)?.username} -> ${players.find((p) => p.id == voteResult.suspectID)?.username}`}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.buttonsGroup}>
          <span className={styles.startRound} onClick={handleStartRound}>
            بدء الجولة
          </span>
          <span className={styles.leaveGame} onClick={handleLeaveGame}>
            {mode === "online" ? "ترك الغرفة" : "انهاء اللعبة"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WaitingPage;
