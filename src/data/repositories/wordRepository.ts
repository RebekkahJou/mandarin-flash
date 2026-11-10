import type { FrequencyTier } from '../../domain/frequencyTier';
import { NEW_WORD_TIER, downgradeTier } from '../../domain/frequencyTier';
import type { Word } from '../../domain/word';
import { allMeaningsOf } from '../../domain/wordList';
import type { SqlDatabase } from '../sqlDatabase';
import type { WordRow } from './rowMappers';
import {
  WORD_COLUMNS,
  parseDefinitions,
  serializeDefinitions,
  toFrequencyTier,
  toWord,
} from './rowMappers';

export interface NewWord {
  profileId: number;
  headword: string;
  variant?: string;
  reading: string;
  definitions: readonly string[];
}

/** How many of a profile's words from one starter set sit in one tier. */
export interface StarterSetTierCount {
  setNumber: number;
  frequencyTier: FrequencyTier;
  wordCount: number;
}

export interface WordWithListIds {
  word: Word;
  /** Each list the word is in, once, even if the list holds it more than once. */
  listIds: number[];
  /** The word's own meanings plus any meanings only some of its lists use. */
  meanings: string[];
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

  /** Lists' own meanings for each word, in list display order. */
  async function listMeaningsByWordId(profileId: number): Promise<Map<number, string[][]>> {
    const rows = await database.getAll<{ word_id: number; definitions_override: string }>(
      `SELECT word_list_entries.word_id, word_list_entries.definitions_override
       FROM word_list_entries JOIN word_lists ON word_lists.id = word_list_entries.word_list_id
       WHERE word_lists.profile_id = ? AND word_list_entries.definitions_override IS NOT NULL
       ORDER BY word_lists.sort_order, word_lists.id, word_list_entries.id`,
      [profileId],
    );
    const meaningsByWordId = new Map<number, string[][]>();
    for (const row of rows) {
      const wordMeanings = meaningsByWordId.get(row.word_id) ?? [];
      wordMeanings.push(parseDefinitions(row.definitions_override));
      meaningsByWordId.set(row.word_id, wordMeanings);
    }
    return meaningsByWordId;
  }

  /** Newest first. Words that are in no list are included so they can be put back into one. */
  async function listWordsWithListIds(profileId: number): Promise<WordWithListIds[]> {
    const listMeanings = await listMeaningsByWordId(profileId);
    const rows = await database.getAll<WordRow & { list_ids: string | null }>(
      `SELECT ${WORD_COLUMNS}, GROUP_CONCAT(DISTINCT word_list_entries.word_list_id) AS list_ids
       FROM words LEFT JOIN word_list_entries ON word_list_entries.word_id = words.id
       WHERE words.profile_id = ?
       GROUP BY words.id
       ORDER BY words.created_at DESC, words.id DESC`,
      [profileId],
    );
    return rows.map((row) => {
      const word = toWord(row);
      return {
        word,
        listIds: parseListIds(row.list_ids),
        meanings: allMeaningsOf(word.definitions, listMeanings.get(word.id) ?? []),
      };
    });
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

  /** Counts a word toward a starter set, unless it already counts toward an earlier one. */
  async function assignStarterSet(wordId: number, setNumber: number): Promise<void> {
    await database.run('UPDATE words SET starter_set = ? WHERE id = ? AND starter_set IS NULL', [
      setNumber,
      wordId,
    ]);
  }

  async function starterSetTierCounts(profileId: number): Promise<StarterSetTierCount[]> {
    const rows = await database.getAll<{
      starter_set: number;
      frequency_tier: string;
      word_count: number;
    }>(
      `SELECT starter_set, frequency_tier, COUNT(*) AS word_count FROM words
       WHERE profile_id = ? AND starter_set IS NOT NULL
       GROUP BY starter_set, frequency_tier`,
      [profileId],
    );
    return rows.map((row) => ({
      setNumber: row.starter_set,
      frequencyTier: toFrequencyTier(row.frequency_tier),
      wordCount: row.word_count,
    }));
  }

  return {
    findWord,
    getWord,
    findOrCreateWord,
    listWordsWithListIds,
    countWords,
    setFrequencyTier,
    markWordLearned,
    assignStarterSet,
    starterSetTierCounts,
  };
}

export type WordRepository = ReturnType<typeof createWordRepository>;
