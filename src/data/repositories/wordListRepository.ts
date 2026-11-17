import type { DefaultWordListDefinition } from '../../domain/defaultWordLists';
import { listKindFor } from '../../domain/defaultWordLists';
import type { WordList } from '../../domain/wordList';
import { WordListKind } from '../../domain/wordList';
import type { SqlDatabase } from '../sqlDatabase';
import type { WordListEntryRow, WordListRow } from './rowMappers';
import { WORD_COLUMNS, serializeDefinitions, toWordList, toWordListEntry } from './rowMappers';

export interface WordListSummary {
  list: WordList;
  /** Computed with COUNT on every read so it can never be stale. */
  length: number;
}

/** A list's name and kind, shown or hidden, without loading its words. */
export interface WordListInfo {
  id: number;
  name: string;
  kind: WordListKind;
  isHidden: boolean;
}

export interface WordListTarget {
  wordListId: number;
  /** Only set when this list should show different meanings from the word's own. */
  definitionsOverride?: readonly string[];
}

const WORD_LIST_COLUMNS = 'id, profile_id, name, kind, part_of_speech';

export function createWordListRepository(database: SqlDatabase) {
  async function listSummaries(profileId: number): Promise<WordListSummary[]> {
    const rows = await database.getAll<WordListRow & { entry_count: number }>(
      `SELECT ${WORD_LIST_COLUMNS},
              (SELECT COUNT(*) FROM word_list_entries WHERE word_list_id = word_lists.id) AS entry_count
       FROM word_lists WHERE profile_id = ? AND is_hidden = 0 ORDER BY sort_order, id`,
      [profileId],
    );
    return rows.map((row) => ({ list: toWordList(row), length: row.entry_count }));
  }

  async function getListWithEntries(wordListId: number): Promise<WordList | null> {
    const listRow = await database.getFirst<WordListRow>(
      `SELECT ${WORD_LIST_COLUMNS} FROM word_lists WHERE id = ?`,
      [wordListId],
    );
    if (!listRow) return null;
    const entryRows = await database.getAll<WordListEntryRow>(
      `SELECT word_list_entries.id AS entry_id, word_list_entries.definitions_override, ${WORD_COLUMNS}
       FROM word_list_entries JOIN words ON words.id = word_list_entries.word_id
       WHERE word_list_entries.word_list_id = ?
       ORDER BY word_list_entries.added_at DESC, word_list_entries.id DESC`,
      [wordListId],
    );
    return toWordList(listRow, entryRows.map(toWordListEntry));
  }

  /**
   * Adds a list after every existing one. Lists the user names are general lists; suggested lists
   * such as Pronouns carry their part of speech.
   */
  async function createList(
    profileId: number,
    definition: DefaultWordListDefinition,
  ): Promise<number> {
    const { name, partOfSpeech } = definition;
    const row = await database.getFirst<{ next_sort_order: number }>(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order FROM word_lists WHERE profile_id = ?',
      [profileId],
    );
    const kind = listKindFor(definition);
    const result = await database.run(
      'INSERT INTO word_lists (profile_id, name, kind, part_of_speech, sort_order) VALUES (?, ?, ?, ?, ?)',
      [profileId, name, kind, partOfSpeech ?? null, row?.next_sort_order ?? 0],
    );
    return result.lastInsertRowId;
  }

  /** Lists of this kind that haven't been filled from the language pack yet. */
  async function listIdsAwaitingFill(profileId: number, kind: WordListKind): Promise<number[]> {
    const rows = await database.getAll<{ id: number }>(
      'SELECT id FROM word_lists WHERE profile_id = ? AND kind = ? AND filled_at IS NULL',
      [profileId, kind],
    );
    return rows.map((row) => row.id);
  }

  /** The profile's first list of this kind, shown or hidden; null when it has none. */
  async function findListIdByKind(profileId: number, kind: WordListKind): Promise<number | null> {
    const row = await database.getFirst<{ id: number }>(
      'SELECT id FROM word_lists WHERE profile_id = ? AND kind = ? ORDER BY id LIMIT 1',
      [profileId, kind],
    );
    return row?.id ?? null;
  }

  /** Every list of the profile, hidden ones included, in display order. */
  async function listInfos(profileId: number): Promise<WordListInfo[]> {
    const rows = await database.getAll<{
      id: number;
      name: string;
      kind: string;
      is_hidden: number;
    }>(
      'SELECT id, name, kind, is_hidden FROM word_lists WHERE profile_id = ? ORDER BY sort_order, id',
      [profileId],
    );
    const kinds = Object.values(WordListKind) as string[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      kind: kinds.includes(row.kind) ? (row.kind as WordListKind) : WordListKind.General,
      isHidden: row.is_hidden === 1,
    }));
  }

  /** A hidden list with this name (ignoring case), so it can be shown again; null if none. */
  async function findHiddenListIdByName(profileId: number, name: string): Promise<number | null> {
    const row = await database.getFirst<{ id: number }>(
      `SELECT id FROM word_lists WHERE profile_id = ? AND is_hidden = 1 AND lower(name) = lower(?)
       ORDER BY id LIMIT 1`,
      [profileId, name],
    );
    return row?.id ?? null;
  }

  /** A hidden list keeps its words and their progress but isn't listed. */
  async function setListHidden(wordListId: number, isHidden: boolean): Promise<void> {
    await database.run('UPDATE word_lists SET is_hidden = ? WHERE id = ?', [
      isHidden ? 1 : 0,
      wordListId,
    ]);
  }

  async function markListFilled(wordListId: number): Promise<void> {
    await database.run('UPDATE word_lists SET filled_at = ? WHERE id = ?', [
      Date.now(),
      wordListId,
    ]);
  }

  async function renameList(wordListId: number, name: string): Promise<void> {
    await database.run('UPDATE word_lists SET name = ? WHERE id = ?', [name, wordListId]);
  }

  /**
   * Deletes the list and its entries (ON DELETE CASCADE). The words themselves stay, so they
   * remain in All words and in any other list.
   */
  async function deleteList(wordListId: number): Promise<void> {
    await database.run('DELETE FROM word_lists WHERE id = ?', [wordListId]);
  }

  /** Saves the order lists are shown in, in one transaction so a failure can't half-apply it. */
  async function setListOrder(orderedListIds: readonly number[]): Promise<void> {
    await database.transaction(async () => {
      for (const [sortOrder, wordListId] of orderedListIds.entries()) {
        await database.run('UPDATE word_lists SET sort_order = ? WHERE id = ?', [
          sortOrder,
          wordListId,
        ]);
      }
    });
  }

  /** Ids of lists (among those given) that already contain this character, for duplicate warnings. */
  async function listIdsContainingHeadword(
    wordListIds: readonly number[],
    headword: string,
  ): Promise<number[]> {
    if (wordListIds.length === 0) return [];
    const placeholders = wordListIds.map(() => '?').join(', ');
    const rows = await database.getAll<{ word_list_id: number }>(
      `SELECT DISTINCT word_list_entries.word_list_id
       FROM word_list_entries JOIN words ON words.id = word_list_entries.word_id
       WHERE words.headword = ? AND word_list_entries.word_list_id IN (${placeholders})`,
      [headword, ...wordListIds],
    );
    return rows.map((row) => row.word_list_id);
  }

  async function headwordsInList(wordListId: number): Promise<Set<string>> {
    const rows = await database.getAll<{ headword: string }>(
      `SELECT DISTINCT words.headword
       FROM word_list_entries JOIN words ON words.id = word_list_entries.word_id
       WHERE word_list_entries.word_list_id = ?`,
      [wordListId],
    );
    return new Set(rows.map((row) => row.headword));
  }

  async function addWordToLists(wordId: number, targets: readonly WordListTarget[]): Promise<void> {
    await database.transaction(async () => {
      for (const target of targets) {
        await database.run(
          'INSERT INTO word_list_entries (word_list_id, word_id, definitions_override, added_at) VALUES (?, ?, ?, ?)',
          [
            target.wordListId,
            wordId,
            target.definitionsOverride ? serializeDefinitions(target.definitionsOverride) : null,
            Date.now(),
          ],
        );
      }
    });
  }

  async function removeEntry(entryId: number): Promise<void> {
    await database.run('DELETE FROM word_list_entries WHERE id = ?', [entryId]);
  }

  /** Changes a meaning in this list only; other lists keep the word's own definitions. */
  async function listIdsContainingWord(wordId: number): Promise<number[]> {
    const rows = await database.getAll<{ word_list_id: number }>(
      'SELECT DISTINCT word_list_id FROM word_list_entries WHERE word_id = ?',
      [wordId],
    );
    return rows.map((row) => row.word_list_id);
  }

  /** Removes every entry of the word in that list, including duplicates. The word itself stays. */
  async function removeWordFromList(wordId: number, wordListId: number): Promise<void> {
    await database.run('DELETE FROM word_list_entries WHERE word_id = ? AND word_list_id = ?', [
      wordId,
      wordListId,
    ]);
  }

  async function setEntryDefinitions(
    entryId: number,
    definitions: readonly string[] | null,
  ): Promise<void> {
    await database.run('UPDATE word_list_entries SET definitions_override = ? WHERE id = ?', [
      definitions === null ? null : serializeDefinitions(definitions),
      entryId,
    ]);
  }

  return {
    listSummaries,
    createList,
    listIdsAwaitingFill,
    markListFilled,
    findListIdByKind,
    listInfos,
    findHiddenListIdByName,
    setListHidden,
    renameList,
    deleteList,
    setListOrder,
    getListWithEntries,
    listIdsContainingHeadword,
    headwordsInList,
    addWordToLists,
    removeEntry,
    listIdsContainingWord,
    removeWordFromList,
    setEntryDefinitions,
  };
}

export type WordListRepository = ReturnType<typeof createWordListRepository>;
