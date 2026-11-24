import { GamePlayer } from '../../domain/gamePlayers';
import {
  gameProgressText,
  passPhoneText,
  playerTurnTitle,
  roundText,
  speedRaceRoundLine,
  speedRaceStartLabel,
  speedRaceTotalLine,
  turnTimeNote,
  winnerText,
} from '../../services/gameText';
import type { LoadedGamePlayers } from './useGamePlayers';
import type { useSpeedRace } from './useSpeedRace';

type SpeedRace = ReturnType<typeof useSpeedRace>;

function resultText(race: SpeedRace, firstName: string, secondName: string) {
  if (!race.outcome) return { resultTitle: '', resultLines: [] };
  return {
    resultTitle: winnerText(race.outcome.winner, firstName, secondName),
    resultLines: [
      ...race.roundTimes.map((times, index) =>
        speedRaceRoundLine(index, times, firstName, secondName),
      ),
      speedRaceTotalLine(race.outcome, firstName, secondName),
    ],
  };
}

/** Everything the speed race screen says, worked out from the race's state. */
export function useSpeedRaceText(race: SpeedRace, players: LoadedGamePlayers) {
  const firstName = players.first.name;
  const secondName = players.second.name;
  const playerName = race.currentPlayer.name;
  const previousName = race.turn.player === GamePlayer.First ? secondName : firstName;
  const stepLabel = roundText(race.turn.roundIndex, race.roundCount);
  const isFirstTurn = race.lastTurnMs === null;
  return {
    stepLabel,
    handoffTitle: isFirstTurn ? playerTurnTitle(playerName) : passPhoneText(playerName),
    handoffNote: isFirstTurn ? null : turnTimeNote(previousName, race.lastTurnMs ?? 0),
    startLabel: speedRaceStartLabel(race.setSize),
    turnHeading: `${stepLabel} · ${playerName}`,
    progressText: gameProgressText(race.progress.completed, race.progress.total),
    ...resultText(race, firstName, secondName),
  };
}
