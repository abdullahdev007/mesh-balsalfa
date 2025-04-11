// /web/game/modes/offline/handler.ts
import { IGameEngine, GameEvent } from "@/game/GameEngine";
import { GameEngine } from "@repo/game-core";

const game = new GameEngine();


export const OfflineGameEngine: IGameEngine = {
  startRound() {
    game.startNewRound();
  },
};
