import React, { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import { useTheme } from "@/context/ThemeContext";
import { LuRefreshCw } from "react-icons/lu";
import { Tooltip } from "react-tooltip";
import { generateRandomUsername } from "@/utils/generateRandomUsername";
import { useGameContext } from "@/context/GameContext";

const UsernameInput = () => {
  const { theme } = useTheme();

  const [tempUsername, setTempUsername] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const { username, setUsername } = useGameContext();

  useEffect(() => {
    if (username) setTempUsername(username);
  }, [username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempUsername(e.target.value);
  };

  const handleBlur = () => {
    setUsername(tempUsername);
    setTempUsername(username!);
  };

  const handleRefresh = () => {
    if (isRotating) return;

    setIsRotating(true);
    const newUsername = generateRandomUsername();
    setTempUsername(newUsername);
    setUsername(newUsername);

    setTimeout(() => {
      setIsRotating(false);
    }, 500);
  };

  return (
    <div
      className={`${theme === "dark" ? styles.dark : styles.light} ${styles.usernameInput}`}
    >
      <input
        type="text"
        placeholder="أسم المستخدم"
        value={tempUsername}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      <span className={styles.border}></span>
      <LuRefreshCw
        data-tooltip-id="refresh-tooltip"
        className={`${styles.refreshIcon} ${isRotating ? styles.rotate : ""}`}
        onClick={handleRefresh}
      />
      <Tooltip
        id="refresh-tooltip"
        content="اسم مستخدم عشوائي"
        style={{ fontSize: "10px", padding: "5px" }}
      />
    </div>
  );
};

export default UsernameInput;
