import { log } from "console";
import { Player, PlayerState } from "./Player";
import { Topic } from "./Topic";

enum RoundPhase {
  ROLE_DISTRIBUTION,
  COMPULSORY_QUESTIONS,
  FREE_ASK,
  VOTING,
  SPY_VOTING,
  ROUND_ITS_OVER,
}

export class Round {
  private players: Player[];
  private currentIndex: number = 0;
  private playerStates: Map<string, PlayerState>;
  private phase: RoundPhase = RoundPhase.ROLE_DISTRIBUTION;

  constructor(
    public id: string,
    public topic: Topic,
    public spy: Player,
    players: Player[]
  ) {
    this.players = this.shuffleArray(players);
    this.playerStates = new Map(
      players.map((player) => [
        player.id,
        new PlayerState(player, spy.id === player.id),
      ])
    );
  }

  private shuffleArray(array: Player[]): Player[] {
    return array.sort(() => Math.random() - 0.5);
  }

  private getPlayerState(player: Player): PlayerState | undefined {
    return this.playerStates.get(player.id);
  }

  giveRole() {
    if (this.phase !== RoundPhase.ROLE_DISTRIBUTION) return;

    const currentPlayer: Player = this.players[this.currentIndex]!;

    console.log(
      `${currentPlayer.name} ${currentPlayer.id === this.spy.id ? `you are a spy` : `the topic is : ${this.topic.name} 📖`}`
    );

    this.currentIndex++;

    if (this.currentIndex >= this.players.length) {
      this.currentIndex = 0;
      this.phase = RoundPhase.COMPULSORY_QUESTIONS;
      return;
    }
  }

  nextTurn(): void {
    if (
      this.phase !== RoundPhase.COMPULSORY_QUESTIONS &&
      this.phase !== RoundPhase.FREE_ASK
    )
      return;

    const asker: Player = this.players[this.currentIndex]!;
    const target: Player =
      this.players[this.currentIndex + 1]! ?? this.players[0]!;

    const askerState: PlayerState = this.getPlayerState(asker)!;

    console.log(
      `${asker?.name} can ask  ${this.phase === RoundPhase.FREE_ASK ? "anyone or start voting" : target?.name}`
    );

    askerState.asked = true;

    if (Array.from(this.playerStates.values()).every((state) => state.asked)) {
      this.phase = RoundPhase.FREE_ASK;
    }

    this.currentIndex = (this.currentIndex + 1) % this.players.length;
  }

  startVoting() {
    this.currentIndex =
      this.currentIndex === 0 ? this.players.length - 1 : this.currentIndex - 1;
    const votingStarterPlayer: Player = this.players[this.currentIndex]!;

    console.log(`${votingStarterPlayer.name} starting vote phase 🗃️`);
    this.phase = RoundPhase.VOTING;
  }

  vote(candidate: Player): void {
    if (this.phase !== RoundPhase.VOTING) return;

    const voter: Player = this.players[this.currentIndex]!;
    const voterState: PlayerState = this.getPlayerState(voter)!;

    const candidateState: PlayerState = this.getPlayerState(candidate)!;

    voterState.vote(candidate, candidateState);

    console.log(`${voter.name} voted to ${candidate.name}`);
    if (candidateState.isSpy && voter.id !== this.spy.id) {
      voterState.incrementScore(10);
    }

    if (Array.from(this.playerStates.values()).every((state) => state.voted)) {
      console.log(`🕵️ All Voice It's Time to Reveal the Spy`);
      console.log(`the spy is ${this.spy.name} 😈 `);

      const spyState: PlayerState = this.getPlayerState(this.spy)!;
      if (
        Array.from(this.playerStates.values())
          .filter((state) => !state.isSpy)
          .every((state) => state.votedForPlayer?.id === this.spy.id)
      ) {
        console.log(
          `all players found a correct spy 😂 [-5 points for spy (${this.spy.name})]`
        );
        spyState.decrementScore(5);
      } else if (
        Array.from(this.playerStates.values())
          .filter((state) => !state.isSpy)
          .every((state) => state.votedForPlayer?.id !== this.spy.id)
      ) {
        console.log(
          `all players failed to find the spy 😂 [+5 points for spy (${this.spy.name})]`
        );
        spyState.incrementScore(5);
      }

      console.log(`now ${this.spy.name} please chose a topic`);
      this.phase = RoundPhase.SPY_VOTING;
    }

    this.currentIndex = (this.currentIndex + 1) % this.players.length;
  }

  voteForTopic(topic: Topic) {
    if (this.phase !== RoundPhase.SPY_VOTING) return;

    if (this.topic.id === topic.id) {
      const spyState: PlayerState = this.getPlayerState(this.spy)!;

      console.log(
        `✅ spy ${this.spy.name} found a correct topic : ${topic.name} [+10 points]`
      );
      spyState.incrementScore(10);
    } else {
      console.log(`❌ spy ${this.spy.name} don't find a correct topic`);
      console.log(`a correct topic is: ${topic.name}`);
    }

    this.endRound();
  }

  endRound() {
    this.phase = RoundPhase.ROUND_ITS_OVER;

    console.log("this round is over ❤️");

    this.playerStates.forEach((playerState: PlayerState) => {
      playerState.player.score += playerState.score;

      console.log(`${playerState.player.name} total score is ${playerState.player.score}`);
      
    });
  }
}
