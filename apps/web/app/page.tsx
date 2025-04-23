"use client";

import Image from "next/image";

import styles from "./page.module.scss";
import { useTheme } from "@/context/ThemeContext";

import { playSound } from "@/utils/soundPlayer";
import { useState } from "react";
import UsernameInput from "@/components/usernameInput/usernameInput";
import { useRouter } from "next/navigation";
import { useGameContext } from "@/context/GameContext";

const Home = () => {
  const { theme } = useTheme();
  const [roomId, setRoomId] = useState<string>("");
  const router = useRouter();
  const { online } = useGameContext();
  
 
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase();
    const formatted = raw.replace(/[^A-Z0-9]/g, "");

    if (formatted.length <= 6) {
      setRoomId(formatted);
    }
  };

  const handleJoin = () => {};

  const handleCreateRoom = () => {
    playSound("click.wav");
    online.createRoom();
    router.push("/lobby/online");
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
                <span> لعبة محلية </span>
              </div>

              <div
                className={`${styles.joinRoom} ${theme === "dark" ? styles.dark : styles.light}`}
              >
                <input
                  type="text"
                  placeholder="معرف الغرفة"
                  maxLength={6}
                  onChange={handleInputChange}
                  value={roomId}
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
