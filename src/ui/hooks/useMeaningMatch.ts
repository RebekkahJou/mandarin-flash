import { useState } from 'react';

import { GameKind, GamePlayer } from '../../domain/gamePlayers';
import type { MeaningMatchRoundCount, MeaningMatchScores } from '../../domain/meaningMatch';
import {
  addMeaningMatchAnswer,
  meaningMatchOptions,
  meaningMatchPickList,
  meaningMatchTurn,
  meaningMatchTurnCount,
  meaningMatchWinner,
  wordFor,
} from '../../domain/meaningMatch';
import type { SharedWordPair } from '../../domain/sharedWords';
import type { Word } from '../../domain/word';
import { useAppServices } from '../AppServicesContext';
import type { GamePlayerInfo, LoadedGamePlayers } from './useGamePlayers';

export enum MeaningMatchStage {
  /** The picker chooses a word for the other player. */
  Picking = 'picking',
  /** The picker passes the phone to the answerer. */
  Handoff = 'handoff',
  Answering = 'answering',
  /** The answerer sees whether they were right. */
  Feedback = 'feedback',
  Finished = 'finished',
}

const NO_SCORES: MeaningMatchScores = { firstPlayerCorrect: 0, secondPlayerCorrect: 0 };

function playerInfo(players: LoadedGamePlayers, player: GamePlayer): GamePlayerInfo {
  return player === GamePlayer.First ? players.first : players.second;
}

/**
 * Runs a meaning match. Each turn the picker chooses a shared word, the phone goes to the other
 * player, who finds that word among 4 in their own language; then the roles swap. The answerer
 * keeps the phone to pick next, so only the answering step needs a hand-off.
 */
export function useMeaningMatch(players: LoadedGamePlayers, roundCount: MeaningMatchRoundCount) {
  const { gameResultRepository } = useAppServices();
  const { pairs } = players;
  const turnCount = meaningMatchTurnCount(roundCount);
  const [turnIndex, setTurnIndex] = useState(0);
  const [stage, setStage] = useState(MeaningMatchStage.Picking);
  const [pickList, setPickList] = useState(() => meaningMatchPickList(pairs, Math.random));
  const [chosen, setChosen] = useState<SharedWordPair<Word> | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const [scores, setScores] = useState(NO_SCORES);
  const turn = meaningMatchTurn(turnIndex);
  const answerWord = chosen ? wordFor(chosen, turn.answerer) : null;

  const pick = (pair: SharedWordPair<Word>) => {
    setChosen(pair);
    setOptions(meaningMatchOptions(pairs, pair, turn.answerer, Math.random));
    setSelectedWordId(null);
    setStage(MeaningMatchStage.Handoff);
  };

  const answer = (word: Word) => {
    if (selectedWordId !== null || !answerWord) return;
    setSelectedWordId(word.id);
    setScores((current) =>
      addMeaningMatchAnswer(current, turn.answerer, word.id === answerWord.id),
    );
    setStage(MeaningMatchStage.Feedback);
  };

  const finish = async () => {
    setStage(MeaningMatchStage.Finished);
    await gameResultRepository.saveGameResult({
      game: GameKind.MeaningMatch,
      firstProfileId: players.first.profileId,
      secondProfileId: players.second.profileId,
      options: { roundCount },
      firstScore: scores.firstPlayerCorrect,
      secondScore: scores.secondPlayerCorrect,
      winner: meaningMatchWinner(scores),
      playedAtMs: Date.now(),
    });
  };

  const next = () => {
    if (turnIndex + 1 >= turnCount) {
      void finish();
      return;
    }
    setTurnIndex(turnIndex + 1);
    setPickList(meaningMatchPickList(pairs, Math.random));
    setChosen(null);
    setStage(MeaningMatchStage.Picking);
  };

  return {
    stage,
    turn,
    turnCount,
    picker: playerInfo(players, turn.picker),
    answerer: playerInfo(players, turn.answerer),
    pickWords: pickList.map((pair) => ({ pair, word: wordFor(pair, turn.picker) })),
    /** The meanings the answerer sees: the picked word's, as the picker studies it. */
    clueMeanings: chosen ? wordFor(chosen, turn.picker).definitions : [],
    options,
    answerWord,
    selectedWordId,
    isAnswerCorrect: selectedWordId !== null && selectedWordId === answerWord?.id,
    scores,
    winner: meaningMatchWinner(scores),
    pick,
    startAnswering: () => setStage(MeaningMatchStage.Answering),
    answer,
    next,
  };
}
