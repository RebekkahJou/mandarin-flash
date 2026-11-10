import type { WordListRepository } from '../data/repositories/wordListRepository';
import type { WordRepository } from '../data/repositories/wordRepository';
import { WordListKind } from '../domain/wordList';
import type { CharacterComponent, DictionaryLookup } from './dictionaryLookup';

export interface ComponentsListServices {
  profileId: number;
  dictionaryLookup: Pick<DictionaryLookup, 'components'>;
  wordRepository: WordRepository;
  wordListRepository: WordListRepository;
}

/** A component's card shows its meaning first, then its usual name. */
export function componentDefinitions(component: CharacterComponent): string[] {
  return [component.meaning, component.name];
}

/** Fills in progress, by profile, so two screens refreshing at once don't fill a list twice. */
const fillsInProgress = new Map<number, Promise<void>>();

/**
 * Fills each Components list that hasn't been filled yet with the pack's components, once. A
 * pack without components leaves the lists waiting, so a later pack can fill them.
 */
export function fillPendingComponentLists(services: ComponentsListServices): Promise<void> {
  const inProgress = fillsInProgress.get(services.profileId);
  if (inProgress) return inProgress;
  const fill = fillLists(services).finally(() => fillsInProgress.delete(services.profileId));
  fillsInProgress.set(services.profileId, fill);
  return fill;
}

async function fillLists(services: ComponentsListServices): Promise<void> {
  const { profileId, wordRepository, wordListRepository } = services;
  const listIds = await wordListRepository.listIdsAwaitingFill(profileId, WordListKind.Components);
  if (listIds.length === 0) return;
  const components = await services.dictionaryLookup.components();
  if (components.length === 0) return;
  for (const wordListId of listIds) {
    for (const component of components) {
      const word = await wordRepository.findOrCreateWord({
        profileId,
        headword: component.component,
        variant: component.variant,
        reading: component.reading,
        definitions: componentDefinitions(component),
      });
      await wordListRepository.addWordToLists(word.id, [{ wordListId }]);
    }
    await wordListRepository.markListFilled(wordListId);
  }
}
