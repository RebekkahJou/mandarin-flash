import type { FrequencyTier } from '../../domain/frequencyTier';
import { NEW_WORD_TIER, downgradeTier } from '../../domain/frequencyTier';
import type { Word } from '../../domain/word';
import type { SqlDatabase } from '../sqlDatabase';
import type { WordRow } from './rowMappers';
import { WORD_COLUMNS, serializeDefinitions, toWord } from './rowMappers';

export interface NewWord {
  profileId: number;
  headword: string;
  variant?: string;
  reading: string;
  definitions: readonly string[];
}

export interface WordWithListIds {
  word: Word;
  /** Each list the word is in, once, even if the list holds it more than once. */
  listIds: number[];
}

function parseListIds(joinedIds: string | null): number[] {
  return joinedIds === null ? [] : joinedIds.split(',').map(Number);
}

export function createWordRepository(database: SqlDatabase) {
  async function findWord(
    profileId: number,
    headword: string,
    reading: string,
  ): Promise<Word | null> {
    const row = await database.getFirst<WordRow>(
      `SELECT ${WORD_COLUMNS} FROM words WHERE profile_id = ? AND headword = ? AND reading = ?`,
      [profileId, headword, reading],
    );
    return row ? toWord(row) : null;
  }

  async function getWord(wordId: number): Promise<Word | null> {
    const row = await database.getFirst<WordRow>(`SELECT ${WORD_COLUMNS} FROM words WHERE id = ?`, [
      wordId,
    ]);
    return row ? toWord(row) : null;
  }

  /** Reuses the existing word (keeping its tier and meanings) so a word is stored only once. */
  async function findOrCreateWord(newWord: NewWord): Promise<Word> {
    const existing = await findWord(newWord.profileId, newWord.headword, newWord.reading);
    if (existing) return existing;
    const result = await database.run(
      `INSERT INTO words (profile_id, headword, variant, reading, definitions, frequency_tier, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newWord.profileId,
        newWord.headword,
        newWord.variant ?? null,
        newWord.reading,
        serializeDefinitions(newWord.definitions),
        NEW_WORD_TIER,
        Date.now(),
      ],
    );
    return {
      id: result.lastInsertRowId,
      profileId: newWord.profileId,
      headword: newWord.headword,
      variant: newWord.variant,
      reading: newWord.reading,
      definitions: [...newWord.definitions],
      frequencyTier: NEW_WORD_TIER,
    };
  }

  /** Newest first. Words that are in no list are included so they can be put back into one. */
  async function listWordsWithListIds(profileId: number): Promise<WordWithListIds[]> {
    const rows = await database.getAll<WordRow & { list_ids: string | null }>(
      `SELECT ${WORD_COLUMNS}, GROUP_CONCAT(DISTINCT word_list_entries.word_list_id) AS list_ids
       FROM words LEFT JOIN word_list_entries ON word_list_entries.word_id = words.id
       WHERE words.profile_id = ?
       GROUP BY words.id
       ORDER BY words.created_at DESC, words.id DESC`,
      [profileId],
    );
    return rows.map((row) => ({ word: toWord(row), listIds: parseListIds(row.list_ids) }));
  }

  async function countWords(profileId: number): Promise<number> {
    const row = await database.getFirst<{ word_count: number }>(
      'SELECT COUNT(*) AS word_count FROM words WHERE profile_id = ?',
      [profileId],
    );
    return row?.word_count ?? 0;
  }

  /** The tier lives on the word row, so this changes it in every list at once. */
  async function setFrequencyTier(wordId: number, tier: FrequencyTier): Promise<void> {
    await database.run('UPDATE words SET frequency_tier = ? WHERE id = ?', [tier, wordId]);
  }

  /** One UPDATE on the shared word row, so the new tier applies in every list at once. */
  async function markWordLearned(wordId: number): Promise<FrequencyTier | null> {
    const word = await getWord(wordId);
    if (!word) return null;
    const newTier = downgradeTier(word.frequencyTier);
    await setFrequencyTier(wordId, newTier);
    return newTier;
  }

  return {
    findWord,
    getWord,
    findOrCreateWord,
    listWordsWithListIds,
    countWords,
    setFrequencyTier,
    markWordLearned,
  };
}

export type WordRepository = ReturnType<typeof createWordRepository>;
