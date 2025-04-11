
// /web/game/engine/GameEngine.ts
export type Player = { id: string; name: string };

export type GameEvent = 'ROUND_STARTED' | 'PLAYER_JOINED' ;

export interface IGameEngine {
  startRound(players: Player[]): void;
  //  on(event: GameEvent, callback: (data: any) => void): void;
  //getState(): GameState | null
}
