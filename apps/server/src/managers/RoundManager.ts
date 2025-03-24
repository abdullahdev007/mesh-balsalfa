import { Question } from "@repo/game-core";
import { Player, Room } from "../models";
import { EventEmitter } from "events";

type WaitingType = "role_assignment" | "voting_phase";

export class RoundManager extends EventEmitter {
  private waitingLists: Record<WaitingType, Set<Player>> = {
    role_assignment: new Set(),
    voting_phase: new Set(),
  };

  private timers: Record<WaitingType, NodeJS.Timeout | null> = {
    role_assignment: null,
    voting_phase: null,
  };

  private readonly WAITING_DURATIONS: Record<WaitingType, number> = {
    role_assignment: 35_000,
    voting_phase: 30_000,
  };

  private questionList: Set<Question> = new Set();

  constructor(public room: Room) {
    super();
  }

  public checkInWaitingList = (
    player: Player,
    listType: WaitingType
  ): boolean => this.waitingLists[listType].has(player);

  public hasTimer = (timerType: WaitingType): boolean =>
    this.timers[timerType] !== null;

  public addToWaitingList(player: Player, waitingType: WaitingType) {
    if (this.checkInWaitingList(player, waitingType)) return;

    this.waitingLists[waitingType].add(player);
    console.log(
      `[RoundManager] Player ${player.id} added to ${waitingType} waiting list.`
    );

    // Start the timer only if it's not already running
    if (!this.hasTimer(waitingType)) {
      this.startWaitingTimer(waitingType);
    }
  }

  private startWaitingTimer(waitingType: WaitingType) {
    console.log(`[RoundManager] Starting ${waitingType} waiting timer...`);

    this.timers[waitingType] = setTimeout(() => {
      this.emit(`${waitingType}_done`, this.room);
      console.log(`[RoundManager] ${waitingType} waiting time expired!`);

      // Clear waiting list after processing
      this.waitingLists[waitingType].clear();
      this.timers[waitingType] = null;
    }, this.WAITING_DURATIONS[waitingType]);
  }

}
