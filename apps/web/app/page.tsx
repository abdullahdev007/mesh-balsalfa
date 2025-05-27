"use client";

import Image from "next/image";

import styles from "./page.module.scss";
import { useTheme } from "@/context/ThemeContext";

import { useEffect, useMemo, useState } from "react";
import dynamic from 'next/dynamic';



const UsernameInput = dynamic(
  () => import('@/components/usernameInput/usernameInput'),
  { ssr: false }
);
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { generateUserId } from "@repo/game-core";
import { OnlineEngineEvents } from "@/services/GameService";

const Home = () => {
  const { theme } = useTheme();
  const [roomID, setRoomId] = useState<string>("");
  const router = useRouter();
  const { online, setMode, offline, username } = useGame();
  const [isConnected, setIsConnected] = useState(online?.isServerConnected);

  useEffect(() => {
    const handleConnectionStatus = (status: { isConnected: boolean }) => {
      setIsConnected(status.isConnected);
      console.log("the connection status changed:", status.isConnected);
      
    };

    online?.on(OnlineEngineEvents.CONNECTION_STATUS, handleConnectionStatus);
    return () => {
      online?.off(OnlineEngineEvents.CONNECTION_STATUS, handleConnectionStatus);
    };
  }, []);

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
    if (username)
      offline.addPlayer({ username: username, id: generateUserId() });
  };


  const logoSrc = useMemo(
    () => `/images/${theme === "dark" ? "light-logo.png" : "dark-logo.png"}`,
    [theme]
  );
  
  return (
    <div className={styles.container}>
      <div className={styles.logoHolder}>
        <Image
          src={logoSrc}
          alt="game logo"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.usernameInputHolder}>
          <UsernameInput />
        </div>

        <div className={styles.flexbox}>
          <div className={styles.buttonsContainer}>
            <div
              className={`${styles.button} ${!isConnected ? styles.disabled : ""}`}
              onClick={isConnected ? handleCreateRoom : undefined}
            >
              <span>أنشاء غرفة</span>
            </div>
            <div
              className={`${styles.button} ${!isConnected ? styles.disabled : ""}`}
              onClick={isConnected ? handleStartLocalGame : undefined}
            >
              <span>لعبة محلية</span>
            </div>
            <div
              className={`${styles.button} ${!isConnected ? styles.disabled : ""}`}
              onClick={isConnected ? () => router.push("/about") : undefined}
            >
              <span>عن اللعبة</span>
            </div>
          </div>

          <div
            className={`${styles.joinRoom} ${theme === "dark" ? styles.dark : styles.light} ${!isConnected ? styles.disabled : ""}`}
          >
            <input
              type="text"
              placeholder="معرف الغرفة"
              maxLength={6}
              onChange={handleInputChange}
              value={roomID}
              disabled={!isConnected}
            />
            <button
              onClick={isConnected ? handleJoin : undefined}
              disabled={!isConnected}
            >
              الانضمام
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
