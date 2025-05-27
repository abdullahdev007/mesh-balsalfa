"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { OnlineGameSystem } from "../services/GameService";
import toast from "react-hot-toast";
import { GameEngine } from "@repo/game-core";
import { useRouter } from "next/navigation";
import { generateRandomUsername } from "@/utils/generateRandomUsername";

type GameMode = "online" | "offline";

type GameContextType = {
  mode: GameMode | null;
  setMode: (mode: GameMode) => void;
  online: OnlineGameSystem;
  offline: GameEngine;
  username: string | null;
  setUsername: (username: string) => void;
  cleanupOfflineGameEngine: () => void;
  cleanupOnlineGameEngine: () => void; // Added
};

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<GameMode | null>(null);
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const storedUsername = localStorage.getItem("username");
      if (!storedUsername) {
        const randomUsername = generateRandomUsername();
        localStorage.setItem("username", randomUsername);
        return randomUsername;
      }
      return storedUsername;
    }
    return null;
  });
  const [gameSystems, setGameSystems] = useState<{
    online: OnlineGameSystem;
    offline: GameEngine;
  } | null>(null);

  const validateAndSetUsername = async (newUsername: string) => {
    if (username === newUsername) return;

    if (newUsername.length < 4 || newUsername.length > 12) {
      toast.error("اسم المستخدم يجب ان يكون بين 4 -12 حرف");
      return;
    }

    setUsername(newUsername);
    toast.success("تم تغيير اسم المستخدم بنجاح");
  };

  const cleanupOfflineGameEngine = () => {
    if (gameSystems?.offline) {
      gameSystems.offline.removeAllListeners();
      setGameSystems((prev) => ({
        ...prev!,
        offline: new GameEngine(),
      }));
    }
  };

  const cleanupOnlineGameEngine = () => {
    if (gameSystems?.online) {
      setGameSystems((prev) => ({
        ...prev!,
        online: new OnlineGameSystem(username || "Guest", router),
      }));
    }
  };

  useEffect(() => {
    setGameSystems({
      online: new OnlineGameSystem(username || "Guest", router),
      offline: new GameEngine(),
    });
  }, [router]);

  useEffect(() => {
    if (username) {
      localStorage.setItem("username", username);
      gameSystems?.online.updateUsername(username);
    } else {
      localStorage.removeItem("username");
    }
  }, [gameSystems?.online, username]);

  if (!gameSystems) {
    return null; // Or a loading state if you prefer
  }

  return (
    <GameContext.Provider
      value={{
        mode,
        setMode,
        online: gameSystems.online,
        offline: gameSystems.offline,
        username,
        setUsername: validateAndSetUsername,
        cleanupOfflineGameEngine,
        cleanupOnlineGameEngine, // Added
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
