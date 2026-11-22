import { GameKind, GameWinner } from '../../domain/gamePlayers';
import {
  gameResultText,
  notEnoughSharedWordsText,
  passPhoneText,
  roundText,
  sharedWordsText,
  turnText,
  winnerText,
} from '../gameText';

const NAMES: Record<number, string> = { 1: 'Me', 2: 'Kid' };
const nameForProfile = (id: number) => NAMES[id] ?? '';

describe('game text', () => {
  it('describes shared words and what is missing to play', () => {
    expect(sharedWordsText(1, 'Kid')).toBe('You and Kid share 1 word.');
    expect(notEnoughSharedWordsText(GameKind.SpeedRace, 9)).toBe(
      'Speed race needs at least 10 words you both study.',
    );
    expect(notEnoughSharedWordsText(GameKind.SpeedRace, 10)).toBeNull();
    expect(notEnoughSharedWordsText(GameKind.MeaningMatch, 4)).toBeNull();
  });

  it('labels hand-offs, rounds and turns counting from 1', () => {
    expect(passPhoneText('Kid')).toBe('Pass the phone to Kid');
    expect(roundText(0, 3)).toBe('Round 1 of 3');
    expect(turnText(9, 10)).toBe('Turn 10 of 10');
  });

  it('names the winner or a tie', () => {
    expect(winnerText(GameWinner.Second, 'Me', 'Kid')).toBe('Kid wins!');
    expect(winnerText(GameWinner.Tie, 'Me', 'Kid')).toBe('It’s a tie!');
  });

  it('summarizes a result with times for speed races and counts for meaning match', () => {
    const result = {
      game: GameKind.SpeedRace,
      firstProfileId: 1,
      secondProfileId: 2,
      options: {},
      firstScore: 116_000,
      secondScore: 130_000,
      winner: GameWinner.First,
      playedAtMs: 0,
    };
    expect(gameResultText(result, nameForProfile)).toBe('Speed race: Me 1:56, Kid 2:10. Me won.');
    expect(
      gameResultText(
        {
          ...result,
          game: GameKind.MeaningMatch,
          firstScore: 4,
          secondScore: 4,
          winner: GameWinner.Tie,
        },
        nameForProfile,
      ),
    ).toBe('Meaning match: Me 4, Kid 4. A tie.');
  });
});
