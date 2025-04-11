// /web/game/GameContext.tsx
import { createContext, useContext } from 'react';

import { IGameEngine } from '@/game/GameEngine';
import { OnlineGameEngine } from "@/game/online/handler";
import { OfflineGameEngine } from '@/game/offline/handler';

const GameContext = createContext<{ engine: IGameEngine } | null>(null);

export const GameProvider = ({ mode, children }: { mode: 'online' | 'offline'; children: React.ReactNode }) => {
  const engine = mode === 'online' ? OnlineGameEngine : OfflineGameEngine;

  return <GameContext.Provider value={{ engine }}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx.engine;
};
