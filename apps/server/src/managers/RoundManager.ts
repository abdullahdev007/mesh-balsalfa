import { Round } from "@repo/game-core";
import Player from "../models/Player";
import Room from "../models/Room";

class RoundManager {
  public waitingList: Set<Player> = new Set();
  public round: Round;
  private timeout: NodeJS.Timeout | undefined;
  private timeoutPromise: Promise<boolean> | undefined;
  private resolveTimeout: ((value: boolean) => void) | undefined;

  constructor(public room: Room) {
    this.round = this.room.game.currentRound!;
 
    if (this.round == undefined) {
      throw Error("no round is available on creating RoundManager");
    }
  }

  addPlayerToWaitingList(player: Player) {
    try {
      if (this.waitingList.has(player)) {
        throw Error("This player is already in the waiting list");
      }

      this.waitingList.add(player);

      const waitingListComplete: boolean = this.waitingList.size === this.round.players.length;

      if (waitingListComplete) this.waitingList.clear();

      return waitingListComplete;
    } catch (error) {
      console.log("Error adding player to waiting list", error);
      throw error;
    }
  }

  startTimeout(duration: number): Promise<boolean> {
    if (this.timeout) {
      return this.timeoutPromise!;
    }

    this.timeoutPromise = new Promise<boolean>((resolve) => {
      this.resolveTimeout = resolve;
      this.timeout = setTimeout(() => {
        this.resolveTimeout?.(true); // Resolve true when timeout completes
        this.clearTimeout();
      }, duration);
    });

    return this.timeoutPromise;
  }

  clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
      this.resolveTimeout?.(false); // Resolve false if timeout is cleared early
      this.resolveTimeout = undefined;
    }
  }


}

export default RoundManager;
