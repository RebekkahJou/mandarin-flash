import type { FrequencyTier } from '../../domain/frequencyTier';
import { NEW_WORD_TIER, downgradeTier } from '../../domain/frequencyTier';
import type { Word } from '../../domain/word';
import type { SqlDatabase } from '../sqlDatabase';
import type { WordRow } from './rowMappers';
import { WORD_COLUMNS, serializeDefinitions, toWord } from './rowMappers';

export interface NewWord {
  profileId: number;
  traditional: string;
  simplified?: string;
  pinyin: string;
  definitions: readonly string[];
}

export function createWordRepository(database: SqlDatabase) {
  async function findWord(
    profileId: number,
    traditional: string,
    pinyin: string,
  ): Promise<Word | null> {
    const row = await database.getFirst<WordRow>(
      `SELECT ${WORD_COLUMNS} FROM words WHERE profile_id = ? AND traditional = ? AND pinyin = ?`,
      [profileId, traditional, pinyin],
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
    const existing = await findWord(newWord.profileId, newWord.traditional, newWord.pinyin);
    if (existing) return existing;
    const result = await database.run(
      `INSERT INTO words (profile_id, traditional, simplified, pinyin, definitions, frequency_tier, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newWord.profileId,
        newWord.traditional,
        newWord.simplified ?? null,
        newWord.pinyin,
        serializeDefinitions(newWord.definitions),
        NEW_WORD_TIER,
        Date.now(),
      ],
    );
    return {
      id: result.lastInsertRowId,
      profileId: newWord.profileId,
      traditional: newWord.traditional,
      simplified: newWord.simplified,
      pinyin: newWord.pinyin,
      definitions: [...newWord.definitions],
      frequencyTier: NEW_WORD_TIER,
    };
  }

  /** One UPDATE on the shared word row, so the new tier applies in every list at once. */
  async function markWordLearned(wordId: number): Promise<FrequencyTier | null> {
    const word = await getWord(wordId);
    if (!word) return null;
    const newTier = downgradeTier(word.frequencyTier);
    await database.run('UPDATE words SET frequency_tier = ? WHERE id = ?', [newTier, wordId]);
    return newTier;
  }

  return { findWord, getWord, findOrCreateWord, markWordLearned };
}

export type WordRepository = ReturnType<typeof createWordRepository>;
