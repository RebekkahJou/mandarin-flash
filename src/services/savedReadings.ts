import type { SettingsRepository } from '../data/repositories/settingsRepository';
import type { WordRepository } from '../data/repositories/wordRepository';
import { planReadingUpdates } from '../domain/savedReadingUpdates';
import type { DictionaryLookup } from './dictionaryLookup';

export interface SavedReadingServices {
  profileId: number;
  /** Identifies the pack's data, e.g. "mandarin:3"; the update runs once per value. */
  packVersionKey: string;
  dictionaryLookup: Pick<DictionaryLookup, 'replacedReadings'>;
  wordRepository: WordRepository;
  settingsRepository: Pick<SettingsRepository, 'loadInternalValue' | 'saveInternalValue'>;
}

const UPDATED_FOR_PACK_KEY = 'savedReadingsUpdatedForPack';

/** Updates in progress, by profile, so two screens loading at once don't update twice. */
const updatesInProgress = new Map<number, Promise<number>>();

/**
 * Gives the profile's saved words the readings the current pack uses (Taiwan readings for
 * Traditional Mandarin), once per pack version. Resolves to how many words changed.
 */
export function updateSavedReadings(services: SavedReadingServices): Promise<number> {
  const inProgress = updatesInProgress.get(services.profileId);
  if (inProgress) return inProgress;
  const update = runUpdate(services).finally(() => updatesInProgress.delete(services.profileId));
  updatesInProgress.set(services.profileId, update);
  return update;
}

async function runUpdate(services: SavedReadingServices): Promise<number> {
  const { profileId, packVersionKey, wordRepository, settingsRepository } = services;
  const updatedFor = await settingsRepository.loadInternalValue(profileId, UPDATED_FOR_PACK_KEY);
  if (updatedFor === packVersionKey) return 0;
  const packReadings = await services.dictionaryLookup.replacedReadings();
  const updates = planReadingUpdates(
    await wordRepository.listWordReadings(profileId),
    packReadings,
  );
  for (const { wordId, newReading } of updates) {
    await wordRepository.changeWordReading(wordId, newReading);
  }
  await settingsRepository.saveInternalValue(profileId, UPDATED_FOR_PACK_KEY, packVersionKey);
  return updates.length;
}
