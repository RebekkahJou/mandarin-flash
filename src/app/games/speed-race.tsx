import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator } from 'react-native';

import type { SpeedRaceOptions } from '../../domain/speedRace';
import { parseSpeedRaceOptions } from '../../domain/speedRace';
import { GameHandoff } from '../../ui/components/GameHandoff';
import { GameResultsView } from '../../ui/components/GameResultsView';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SpeedRaceTurnView } from '../../ui/components/SpeedRaceTurnView';
import type { LoadedGamePlayers } from '../../ui/hooks/useGamePlayers';
import { useGamePlayers } from '../../ui/hooks/useGamePlayers';
import { SpeedRaceStage, useSpeedRace } from '../../ui/hooks/useSpeedRace';
import { useSpeedRaceText } from '../../ui/hooks/useSpeedRaceText';
import { colors } from '../../ui/theme';

type SpeedRaceParams = {
  opponentId: string;
  wordCount: string;
  roundCount: string;
  cardFront: string;
};

export default function SpeedRaceScreen() {
  const params = useLocalSearchParams<SpeedRaceParams>();
  const { wordCount, roundCount, cardFront } = params;
  const options = useMemo(
    () => parseSpeedRaceOptions({ wordCount, roundCount, cardFront }),
    [wordCount, roundCount, cardFront],
  );
  const players = useGamePlayers(Number(params.opponentId));
  if (!players) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.accent} size="large" />
      </ScreenContainer>
    );
  }
  return <SpeedRace players={players} options={options} />;
}

interface SpeedRaceProps {
  players: LoadedGamePlayers;
  options: SpeedRaceOptions;
}

/** The race itself, started once both players and their shared words have loaded. */
function SpeedRace({ players, options }: SpeedRaceProps) {
  const race = useSpeedRace(players, options);
  const text = useSpeedRaceText(race, players);

  if (race.stage === SpeedRaceStage.Finished) {
    return (
      <ScreenContainer>
        <GameResultsView
          title={text.resultTitle}
          lines={text.resultLines}
          onDone={() => router.back()}
        />
      </ScreenContainer>
    );
  }
  if (race.stage === SpeedRaceStage.Ready || !race.currentWord) {
    return (
      <ScreenContainer>
        <GameHandoff
          stepLabel={text.stepLabel}
          title={text.handoffTitle}
          note={text.handoffNote}
          startLabel={text.startLabel}
          onStart={race.startTurn}
        />
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer>
      <SpeedRaceTurnView
        heading={text.turnHeading}
        progressText={text.progressText}
        elapsedMs={race.elapsedMs}
        word={race.currentWord}
        front={options.cardFront}
        phoneticDisplay={race.currentPlayer.phoneticDisplay}
        font={race.font}
        isRevealed={race.isRevealed}
        onReveal={race.reveal}
        onMissed={race.markMissed}
        onGotten={race.markGotten}
      />
    </ScreenContainer>
  );
}
