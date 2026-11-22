/**
 * Loads the cards for a practice set: a new set drawn from the list, the list's paused set, or
 * its saved set. Words that left the list since a set was paused or saved (New Words changes on
 * its own) are still practiced, with their own meanings; deleted words are left out.
 */
import type { PracticeSessionRepository } from '../data/repositories/practiceSessionRepository';
import type { WordListRepository } from '../data/repositories/wordListRepository';
import type { WordRepository } from '../data/repositories/wordRepository';
import type { PracticeCard } from '../domain/practiceCard';
import { distinctPracticeCards } from '../domain/practiceCard';
import { buildPracticeSet } from '../domain/practiceSetBuilder';
import { PracticeSession } from '../domain/practiceSession';
import { SessionTimer } from '../domain/sessionTimer';

/** How a practice set starts; also the practice route's "start" param. */
export enum PracticeStart {
  New = 'new',
  Resume = 'resume',
  Saved = 'saved',
}

export interface LoadedPracticeSet {
  session: PracticeSession;
  timer: SessionTimer;
  cardsByWordId: Map<number, PracticeCard>;
  /** True when this is the list's saved set, so getting every word records a time. */
  isSavedSet: boolean;
}

export interface PracticeSetSources {
  wordListRepository: Pick<WordListRepository, 'getListWithEntries'>;
  wordRepository: Pick<WordRepository, 'getWord'>;
  practiceSessionRepository: Pick<PracticeSessionRepository, 'loadPausedSet' | 'loadSavedSet'>;
}

async function loadListCards(
  sources: PracticeSetSources,
  wordListId: number,
): Promise<Map<number, PracticeCard>> {
  const list = await sources.wordListRepository.getListWithEntries(wordListId);
  const cards = distinctPracticeCards(list?.words ?? []);
  return new Map(cards.map((card) => [card.word.id, card]));
}

async function addCardsForMissingWords(
  sources: PracticeSetSources,
  wordIds: readonly number[],
  cardsByWordId: Map<number, PracticeCard>,
): Promise<void> {
  for (const wordId of wordIds) {
    if (cardsByWordId.has(wordId)) continue;
    const word = await sources.wordRepository.getWord(wordId);
    if (word) cardsByWordId.set(wordId, { word, definitions: word.definitions });
  }
}

function drawNewSet(cardsByWordId: Map<number, PracticeCard>, setSize: number): LoadedPracticeSet {
  const words = [...cardsByWordId.values()].map((card) => card.word);
  const session = new PracticeSession(buildPracticeSet(words, setSize).map((word) => word.id));
  return { session, timer: new SessionTimer(), cardsByWordId, isSavedSet: false };
}

async function resumePausedSet(
  sources: PracticeSetSources,
  wordListId: number,
  cardsByWordId: Map<number, PracticeCard>,
): Promise<LoadedPracticeSet | null> {
  const paused = await sources.practiceSessionRepository.loadPausedSet(wordListId);
  if (!paused) return null;
  await addCardsForMissingWords(sources, paused.state.session.wordIds, cardsByWordId);
  const session = PracticeSession.fromSnapshot(paused.state.session, new Set(cardsByWordId.keys()));
  const timer = new SessionTimer(Date.now, paused.state.timer);
  return { session, timer, cardsByWordId, isSavedSet: paused.state.isSavedSet === true };
}

/** The saved set's words in a fresh order each time. */
async function startSavedSet(
  sources: PracticeSetSources,
  wordListId: number,
  cardsByWordId: Map<number, PracticeCard>,
): Promise<LoadedPracticeSet | null> {
  const saved = await sources.practiceSessionRepository.loadSavedSet(wordListId);
  if (!saved) return null;
  await addCardsForMissingWords(sources, saved.wordIds, cardsByWordId);
  const words = saved.wordIds.flatMap((wordId) => cardsByWordId.get(wordId)?.word ?? []);
  const session = new PracticeSession(buildPracticeSet(words, words.length).map((word) => word.id));
  return { session, timer: new SessionTimer(), cardsByWordId, isSavedSet: true };
}

/** Falls back to a new set when the paused or saved set is gone. */
export async function loadPracticeSet(
  sources: PracticeSetSources,
  wordListId: number,
  setSize: number,
  start: PracticeStart,
): Promise<LoadedPracticeSet> {
  const cardsByWordId = await loadListCards(sources, wordListId);
  const loaders: Record<PracticeStart, () => Promise<LoadedPracticeSet | null>> = {
    [PracticeStart.New]: async () => null,
    [PracticeStart.Resume]: () => resumePausedSet(sources, wordListId, cardsByWordId),
    [PracticeStart.Saved]: () => startSavedSet(sources, wordListId, cardsByWordId),
  };
  return (await loaders[start]()) ?? drawNewSet(cardsByWordId, setSize);
}

export function isPracticeStart(value: string | undefined): value is PracticeStart {
  return (Object.values(PracticeStart) as (string | undefined)[]).includes(value);
}
