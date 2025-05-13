import { Room } from "../models";
import { EventEmitter } from "events";

type TimerID = string;

interface CountdownConfig {
  duration: number;
  onExpire: () => void;
}

export class RoundManager extends EventEmitter {
  // Maps to track timers and player waiting lists based on timer ID
  private countdowns: Map<TimerID, NodeJS.Timeout> = new Map();
  private endTimes: Map<TimerID, number> = new Map();
  private waitingLists: Map<TimerID, Set<string>> = new Map();  // Waiting lists based on timer ID

  constructor(public room: Room) {
    super();
  }

  // Add player to the waiting list for a specific timer ID
  public addToWaitingList(playerId: string, timerId: TimerID) {
    let waitingList = this.waitingLists.get(timerId);
    if (!waitingList) {
      waitingList = new Set();
      this.waitingLists.set(timerId, waitingList);
    }

    if (waitingList.has(playerId)) return;

    waitingList.add(playerId);
    console.log(`[RoundManager] Player ${playerId} added to waiting list for timer '${timerId}'.`);
  }

  // Check if player is in the waiting list for a specific timer ID
  public checkInWaitingList(playerId: string, timerId: TimerID): boolean {
    const waitingList = this.waitingLists.get(timerId);
    return waitingList ? waitingList.has(playerId) : false;
  }

  // Clear the waiting list for a specific timer ID
  public clearWaitingList(timerId: TimerID) {
    const waitingList = this.waitingLists.get(timerId);
    if (waitingList) {
      waitingList.clear();
      console.log(`[RoundManager] Waiting list for timer '${timerId}' cleared.`);
    }
  }

  // Start a countdown timer for a specific phase
  public startCountdown(id: TimerID, config: CountdownConfig) {
    if (this.countdowns.has(id)) {
      console.warn(`[RoundManager] Timer '${id}' already exists. Skipping.`);
      return;
    }

    const timeout = setTimeout(() => {
      config.onExpire();
      this.countdowns.delete(id);
      this.endTimes.delete(id);
      this.clearWaitingList(id);  // Clear waiting list when the timer expires
    }, config.duration);

    this.countdowns.set(id, timeout);
    this.endTimes.set(id, Date.now() + config.duration);

    console.log(`[RoundManager] Timer '${id}' started for ${config.duration}ms`);
  }

  // Cancel a countdown by its ID
  public cancelCountdown(id: TimerID) {
    const timer = this.countdowns.get(id);
    if (!timer) return;

    clearTimeout(timer);
    this.countdowns.delete(id);
    this.endTimes.delete(id);
    this.clearWaitingList(id);  // Clear waiting list when timer is cancelled
    console.log(`[RoundManager] Timer '${id}' cancelled.`);
  }

  // Check if a countdown exists
  public hasCountdown(id: TimerID): boolean {
    return this.countdowns.has(id);
  }

  // Get the remaining time of a countdown by its ID
  public getRemainingTime(id: TimerID): number | null {
    if (!this.endTimes.has(id)) return null;
    return Math.max(0, this.endTimes.get(id)! - Date.now());
  }

  // Get all active countdown IDs
  public getActiveCountdowns(): string[] {
    return [...this.countdowns.keys()];
  }

  // Get the count of players ready for a specific timer ID
  public getReadyCount(timerId: TimerID): number {
    const waitingList = this.waitingLists.get(timerId);
    return waitingList ? waitingList.size : 0;
  }

  // Public method to access the waiting list for a given timer ID
  public getWaitingList(timerId: TimerID): Set<string> {
    return this.waitingLists.get(timerId) || new Set();
  }
}
