import { Player, VoteResult } from "../models";

export class VotingSystem {
  private players: Player[] = [];

  setup(players: Player[]) {
    this.players = players;
  }

  vote(voterID: string, suspectID: string, votes: VoteResult[]): VoteResult {
    if (votes.some((voteResult: VoteResult) => voteResult.voterID == voterID))
      throw Error("this player is already voted");

    return {
      voterID,
      suspectID,
    };
  }

  isVotingComplete = (votes: VoteResult[]): boolean =>
    this.players.length <= votes.length;
}
