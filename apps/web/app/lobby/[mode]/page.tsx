"use client";

import React, { use, useEffect, useState } from "react";
import styles from "../styles.module.scss";
import { Tooltip } from "react-tooltip";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";
import AddPlayerModal from "@/components/modals/addPlayerModal/addPlayerModal";

import TopicModal from "@/components/modals/TopicModal/TopicModal";
import { useRouter } from "next/navigation";
import { playSound } from "@/utils/soundPlayer";
import { useGameContext } from "@/context/GameContext";
import { Topic } from "@repo/game-core";

const WaitingPage = ({ params }: { params: Promise<{ mode: string }> }) => {
  const [tooltipText, setTooltipText] = useState("أضغط ل النسخ");
  const { mode } = use(params);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);

  const { socket, online } = useGameContext();
  const [isAdmin, setIsAdmin] = useState<boolean>();

  useEffect(() => {
    if(socket === null) return;

    setIsAdmin(online.roomInfo?.adminID === socket!.id);

  }, [socket,online.roomInfo]);

  const router = useRouter();

  const handleOpenTopicsModal = () => {
    setIsTopicsModalOpen(true);
  };

  const handleSaveTopics = () => {};

  const handleCloseTopicsModal = () => {
    setIsTopicsModalOpen(false);
  };

  const handleAddPlayer = (username: string) => {
    console.log(username);
  };

  const { theme } = useTheme();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(online.roomInfo?.id ?? "");
    setTooltipText("تم النسخ");

    setTimeout(() => {
      setTooltipText("أضغط ل النسخ");
    }, 1000);
  };

  const handleLeaveGame = () => {
    router.back();
    playSound("click.wav");
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.roomID}>
          <span className={styles.title}>معرف الغرفة</span>
          <span
            className={styles.id}
            data-tooltip-id="roomID-tooltip"
            data-tooltip-content={tooltipText}
            onClick={handleCopy}
          >
            {online.roomInfo?.id}
          </span>

          <Tooltip id="roomID-tooltip" style={{ fontSize: "15px" }} />
        </div>

        <div className={styles.topicSelect}>
          <span>الحيوانات</span>

          <button
            className={styles.updateTopic}
            onClick={handleOpenTopicsModal}
          >
            حدث السوالف او اختار سالفة جديدة
          </button>

          <TopicModal
            isOpen={isTopicsModalOpen}
            topics={online.roomInfo?.topics!}
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
            <ul>
              {online.roomInfo?.players.map((player,index) => (
                <li key={player.id}>{`${index++}. ${player.username}`}</li>
              ))}
            </ul>

            {mode == "offline" && isAdmin ? (
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
                  onAddPlayer={handleAddPlayer}
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
              {online.roomInfo?.rounds.length === 0 ? (
                <div className={styles.noRoundYet}>
                  {" "}
                  <span>لا يوجد اي جولة تم لعبها بعد</span>
                </div>
              ) : (
                online.roomInfo?.rounds.map((round) => (
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
                      <span>{round.spy.name}</span>
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
                              {`${online.roomInfo?.players.find((p) => p.id == voteResult.voterID)?.username} -> ${online.roomInfo?.players.find((p) => p.id == voteResult.suspectID)?.username}`}
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
          <span className={styles.startRound}>بدء الجولة</span>
          <span className={styles.leaveGame} onClick={handleLeaveGame}>
            {mode === "online" ? "ترك الغرفة" : "انهاء اللعبة"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WaitingPage;
