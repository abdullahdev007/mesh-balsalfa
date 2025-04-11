// /web/game/modes/online/handler.ts
import { ClientEvents } from '@repo/socket-events';
import { IGameEngine, GameEvent } from '@/game/GameEngine';
import { socket } from './client';

export const OnlineGameEngine: IGameEngine = {
  startRound() {
    socket.emit(ClientEvents.START_ROUND);
  },


  on(event: GameEvent, callback : (data: any) => void) {
    socket.on(event, callback);
  },


};
