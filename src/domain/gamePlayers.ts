/** The two players of a game between profiles, and who won. */

export enum GamePlayer {
  /** The profile that started the game; it plays first. */
  First = 'first',
  Second = 'second',
}

export enum GameWinner {
  First = 'first',
  Second = 'second',
  Tie = 'tie',
}

export enum GameKind {
  SpeedRace = 'speed_race',
  MeaningMatch = 'meaning_match',
}

export function otherPlayer(player: GamePlayer): GamePlayer {
  return player === GamePlayer.First ? GamePlayer.Second : GamePlayer.First;
}

/** The winner by score; isLowerBetter for times. */
export function winnerByScore(
  firstScore: number,
  secondScore: number,
  isLowerBetter: boolean,
): GameWinner {
  if (firstScore === secondScore) return GameWinner.Tie;
  const isFirstAhead = isLowerBetter ? firstScore < secondScore : firstScore > secondScore;
  return isFirstAhead ? GameWinner.First : GameWinner.Second;
}
