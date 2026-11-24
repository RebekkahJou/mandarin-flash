import { GameKind, GameWinner } from '../../domain/gamePlayers';
import { LanguageId } from '../../domain/language';
import {
  answerFeedbackTitle,
  gameProgressText,
  gameResultText,
  meaningMatchScoreLine,
  meaningOptionLabel,
  notEnoughSharedWordsText,
  opponentLabel,
  passPhoneText,
  pickWordHint,
  playerTurnTitle,
  roundText,
  sharedWordsText,
  speedRaceRoundLine,
  speedRaceStartLabel,
  speedRaceTotalLine,
  startGameLabel,
  turnTimeNote,
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
    expect(startGameLabel(GameKind.MeaningMatch)).toBe('Start meaning match');
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

  it('describes turns, times and scores during a game', () => {
    expect(playerTurnTitle('Kid')).toBe('Kid’s turn');
    expect(turnTimeNote('Me', 83_000)).toBe('Me took 1:23.');
    expect(
      speedRaceRoundLine(0, { firstPlayerMs: 83_000, secondPlayerMs: 100_000 }, 'Me', 'Kid'),
    ).toBe('Round 1: Me 1:23, Kid 1:40');
    expect(
      speedRaceTotalLine(
        { firstPlayerTotalMs: 83_000, secondPlayerTotalMs: 100_000, winner: GameWinner.First },
        'Me',
        'Kid',
      ),
    ).toBe('Total: Me 1:23, Kid 1:40');
    expect(
      meaningMatchScoreLine({ firstPlayerCorrect: 4, secondPlayerCorrect: 3 }, 'Me', 'Kid'),
    ).toBe('Me 4 right, Kid 3 right');
    expect(answerFeedbackTitle(false)).toBe('Not quite.');
    expect(speedRaceStartLabel(20)).toBe('Start (20 words)');
    expect(gameProgressText(3, 20)).toBe('3 / 20 done');
  });

  it('marks the right option and a wrong pick once answered', () => {
    expect(meaningOptionLabel('好', false, true, false)).toBe('好');
    expect(meaningOptionLabel('好', true, true, false)).toBe('好 ✓');
    expect(meaningOptionLabel('人', true, false, true)).toBe('人 ✗');
    expect(meaningOptionLabel('大', true, false, false)).toBe('大');
    expect(pickWordHint('Kid')).toBe('Kid will see its meaning and look for the word.');
  });

  it('adds the language to an opponent’s name only when another profile has that name', () => {
    const me = { id: 1, name: 'Me', languageId: LanguageId.MandarinTraditional, lastUsedAtMs: 0 };
    const meSimplified = { ...me, id: 2, languageId: LanguageId.MandarinSimplified };
    const kid = { ...me, id: 3, name: 'Kid' };
    expect(opponentLabel(kid, [me, kid])).toBe('Kid');
    expect(opponentLabel(meSimplified, [me, meSimplified])).toBe('Me · Mandarin (Simplified)');
  });
});
