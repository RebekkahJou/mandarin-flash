import type { WordListRepository } from '../data/repositories/wordListRepository';
import type { DefaultWordListDefinition } from '../domain/defaultWordLists';
import { PartOfSpeechWordList } from '../domain/partOfSpeechWordList';
import type { WordList } from '../domain/wordList';

/** A part-of-speech list of that type, else a list with that name (ignoring case). */
function findList(lists: readonly WordList[], definition: DefaultWordListDefinition) {
  const byPartOfSpeech = lists.find(
    (list) =>
      definition.partOfSpeech !== undefined &&
      list instanceof PartOfSpeechWordList &&
      list.partOfSpeech === definition.partOfSpeech,
  );
  const lowerCaseName = definition.name.toLowerCase();
  return byPartOfSpeech ?? lists.find((list) => list.name.toLowerCase() === lowerCaseName);
}

/**
 * Finds a profile's lists by definition, creating any that are missing, for bulk adds such as
 * starter sets. Hidden lists aren't found, so a hidden list of the same name is left alone.
 */
export async function createProfileListFinder(
  profileId: number,
  wordListRepository: WordListRepository,
) {
  const loadLists = async () =>
    (await wordListRepository.listSummaries(profileId)).map(({ list }) => list);
  let lists = await loadLists();
  return async function ensureList(definition: DefaultWordListDefinition): Promise<WordList> {
    const existing = findList(lists, definition);
    if (existing) return existing;
    const newListId = await wordListRepository.createList(profileId, definition);
    lists = await loadLists();
    const created = lists.find((list) => list.id === newListId);
    if (!created) throw new Error(`The ${definition.name} list could not be created.`);
    return created;
  };
}
