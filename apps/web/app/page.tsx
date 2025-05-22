"use client";

import Image from "next/image";

import styles from "./page.module.scss";
import { useTheme } from "@/context/ThemeContext";

import { useState } from "react";
import UsernameInput from "@/components/usernameInput/usernameInput";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { generateUserId } from "@repo/game-core";

const Home = () => {
  const { theme } = useTheme();
  const [roomID, setRoomId] = useState<string>("");
  const router = useRouter();
  const { online, setMode,offline,username } = useGame();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase();
    const formatted = raw.replace(/[^A-Z0-9]/g, "");

    if (formatted.length <= 6) {
      setRoomId(formatted);
    }
  };

  const handleJoin = () => {
    if (!roomID) return;
    online.joinRoom(roomID);
    setMode("online");
  };

  const handleCreateRoom = () => {
    online.createRoom();
    router.push("/lobby");
    setMode("online");
  };

  const handleStartLocalGame = () => {
    router.push("/lobby");
    setMode("offline");
    if(username) 
      offline.addPlayer({username: username,id: generateUserId()});

  };

  return (
    <div className={styles.container}>
      <div className={styles.logoHolder}>
        <Image
          src={`/images/${theme === "dark" ? "light-logo.png" : "dark-logo.png"}`}
          alt="game logo"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.container}>
          <UsernameInput />

          <div className={styles.flexbox}>
            <div className={styles.buttons}>
              <span onClick={handleCreateRoom}> أنشاء غرفة </span>
              <span onClick={handleStartLocalGame}> لعبة محلية </span>
            </div>

            <div
              className={`${styles.joinRoom} ${theme === "dark" ? styles.dark : styles.light}`}
            >
              <input
                type="text"
                placeholder="معرف الغرفة"
                maxLength={6}
                onChange={handleInputChange}
                value={roomID}
              />
              <button onClick={handleJoin}>الانضمام</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
