import type { MeaningFeedback, MeaningOption } from '../components/MeaningQuestionView';
import type { PickableWord } from '../components/MeaningPickView';
import {
  MEANING_QUESTION_PROMPT,
  answerFeedbackTitle,
  meaningMatchScoreLine,
  meaningOptionLabel,
  passPhoneText,
  pickWordHint,
  pickWordTitle,
  turnText,
  winnerText,
} from '../../services/gameText';
import { phoneticText } from '../../services/phoneticText';
import type { LoadedGamePlayers } from './useGamePlayers';
import type { useMeaningMatch } from './useMeaningMatch';

type MeaningMatch = ReturnType<typeof useMeaningMatch>;

const NEXT_TURN_LABEL = 'Next';
const SEE_RESULTS_LABEL = 'See results';

function feedbackFor(match: MeaningMatch): MeaningFeedback | null {
  if (match.selectedWordId === null || !match.answerWord) return null;
  const reading = phoneticText(match.answerWord.reading, match.answerer.phoneticDisplay);
  const isLastTurn = match.turn.turnIndex + 1 >= match.turnCount;
  return {
    title: answerFeedbackTitle(match.isAnswerCorrect),
    answerText: `${match.answerWord.headword}  ${reading}`,
    onNext: match.next,
    nextLabel: isLastTurn ? SEE_RESULTS_LABEL : NEXT_TURN_LABEL,
  };
}

function optionsFor(match: MeaningMatch): MeaningOption[] {
  const isAnswered = match.selectedWordId !== null;
  return match.options.map((word) => ({
    key: word.id,
    label: meaningOptionLabel(
      word.headword,
      isAnswered,
      word.id === match.answerWord?.id,
      word.id === match.selectedWordId,
    ),
    onChoose: () => match.answer(word),
  }));
}

/** What each stage of the meaning match screen shows, worked out from the match's state. */
export function useMeaningMatchView(match: MeaningMatch, players: LoadedGamePlayers) {
  const firstName = players.first.name;
  const secondName = players.second.name;
  const stepLabel = turnText(match.turn.turnIndex, match.turnCount);
  const pickWords: PickableWord[] = match.pickWords.map(({ pair, word }) => ({
    key: word.id,
    word,
    onPick: () => match.pick(pair),
  }));
  return {
    stepLabel,
    pickTitle: pickWordTitle(match.picker.name),
    pickHint: pickWordHint(match.answerer.name),
    pickWords,
    handoffTitle: passPhoneText(match.answerer.name),
    questionHeading: `${stepLabel} · ${match.answerer.name}`,
    questionPrompt: MEANING_QUESTION_PROMPT,
    options: optionsFor(match),
    feedback: feedbackFor(match),
    resultTitle: winnerText(match.winner, firstName, secondName),
    resultLines: [meaningMatchScoreLine(match.scores, firstName, secondName)],
  };
}
