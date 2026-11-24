import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import type { MeaningMatchRoundCount } from '../../domain/meaningMatch';
import { parseMeaningMatchRoundCount } from '../../domain/meaningMatch';
import { GameHandoff } from '../../ui/components/GameHandoff';
import { GameResultsView } from '../../ui/components/GameResultsView';
import { MeaningPickView } from '../../ui/components/MeaningPickView';
import { MeaningQuestionView } from '../../ui/components/MeaningQuestionView';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import type { LoadedGamePlayers } from '../../ui/hooks/useGamePlayers';
import { useGamePlayers } from '../../ui/hooks/useGamePlayers';
import { useLeaveChallengeConfirmation } from '../../ui/hooks/useLeaveChallengeConfirmation';
import { MeaningMatchStage, useMeaningMatch } from '../../ui/hooks/useMeaningMatch';
import { useMeaningMatchView } from '../../ui/hooks/useMeaningMatchView';
import { colors } from '../../ui/theme';

type MeaningMatchParams = {
  opponentId: string;
  roundCount: string;
};

const START_ANSWERING_LABEL = 'Show the meaning';

export default function MeaningMatchScreen() {
  const params = useLocalSearchParams<MeaningMatchParams>();
  const roundCount = parseMeaningMatchRoundCount(params.roundCount);
  const players = useGamePlayers(Number(params.opponentId));
  if (!players) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.accent} size="large" />
      </ScreenContainer>
    );
  }
  return <MeaningMatch players={players} roundCount={roundCount} />;
}

interface MeaningMatchProps {
  players: LoadedGamePlayers;
  roundCount: MeaningMatchRoundCount;
}

/** The match itself, started once both players and their shared words have loaded. */
function MeaningMatch({ players, roundCount }: MeaningMatchProps) {
  const match = useMeaningMatch(players, roundCount);
  const view = useMeaningMatchView(match, players);
  useLeaveChallengeConfirmation(match.stage !== MeaningMatchStage.Finished);
  // A new key per turn starts each list at the top instead of at the last scroll position.
  const pickKey = `pick-${match.turn.turnIndex}`;
  const questionKey = `question-${match.turn.turnIndex}`;

  if (match.stage === MeaningMatchStage.Finished) {
    return (
      <ScreenContainer>
        <GameResultsView
          title={view.resultTitle}
          lines={view.resultLines}
          onDone={() => router.back()}
        />
      </ScreenContainer>
    );
  }
  if (match.stage === MeaningMatchStage.Picking) {
    return (
      <ScreenContainer key={pickKey} isScrollable>
        <MeaningPickView
          stepLabel={view.stepLabel}
          title={view.pickTitle}
          hint={view.pickHint}
          words={view.pickWords}
          phoneticDisplay={match.picker.phoneticDisplay}
        />
      </ScreenContainer>
    );
  }
  if (match.stage === MeaningMatchStage.Handoff) {
    return (
      <ScreenContainer>
        <GameHandoff
          stepLabel={view.stepLabel}
          title={view.handoffTitle}
          note={null}
          startLabel={START_ANSWERING_LABEL}
          onStart={match.startAnswering}
        />
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer key={questionKey} isScrollable>
      <MeaningQuestionView
        heading={view.questionHeading}
        prompt={view.questionPrompt}
        meanings={match.clueMeanings}
        options={view.options}
        feedback={view.feedback}
      />
    </ScreenContainer>
  );
}
