'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { OnlineGameEngine } from '@/game/Online';
import { generateRandomUsername } from '@/utils/generateRandomUsername';
import toast from 'react-hot-toast';
import { OfflineGameEngine } from '@/game/Offline';

type GameContextType = {
  online: OnlineGameEngine;
  offline: OfflineGameEngine;
  socket: Socket;
  username: string | null;
  setUsername: (username: string) => void;
  clearGameEngines: () => void;
};

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineEngine, setOnlineEngine] = useState<OnlineGameEngine | null>(null);
  const [offlineEngine, setOfflineEngine] = useState<OfflineGameEngine | null>(null);
  const [username, _setUsername] = useState<string | null>(null);

  // Validate and set username
  const validateUsername = (username: string): boolean => {
    if (username.length >= 4 && username.length <= 12) return true;
    toast.error('اسم المستخدم يجب أن يكون بين 4 و 12 حرفًا');
    return false;
  };

  const setUsername = (newUsername: string) => {
    if (!validateUsername(newUsername)) return;

    _setUsername(newUsername);
    localStorage.setItem('username', newUsername);
    toast.success('تم تحديث اسم المستخدم بنجاح');
  };

  useEffect(() => {
    const savedUsername = localStorage.getItem('username') || generateRandomUsername();
    _setUsername(savedUsername);
  }, []);

  useEffect(() => {
    if (!username) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_SERVER_URL!, {
      withCredentials: true,
      query: { username },
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [username]);

  useEffect(() => {
    if (!socket) return;

    setOnlineEngine(new OnlineGameEngine(socket));
    setOfflineEngine(new OfflineGameEngine());
  }, [socket]);

  const clearGameEngines = () => {
    if (!socket) return;
    
    onlineEngine?.cleanup();
    
    setOnlineEngine(new OnlineGameEngine(socket));
    setOfflineEngine(new OfflineGameEngine());
  };

  if (!socket || !onlineEngine || !offlineEngine) return null;

  return (
    <GameContext.Provider
      value={{
        online: onlineEngine,
        offline: offlineEngine,
        socket,
        username,
        setUsername,
        clearGameEngines,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameContext must be used within a GameProvider');
  return context;
};
