import React, { useState } from "react";

import styles from "./styles.module.scss";

import { Panel } from "@/page";
import { useTheme } from "@/context/ThemeContext";
import { playSound } from "@/utils/soundPlayer";
import UsernameInput from "@/components/usernameInput/usernameInput";

const MainPanel = ({
  setActivePanel,
}: {
  setActivePanel: (panel: Panel) => void;
}) => {
  const { theme } = useTheme();
  const [roomId, setRoomId] = useState<string>("");

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
  };

  return (
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
  );
};

export default MainPanel;
