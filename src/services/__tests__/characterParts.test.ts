/**
 * @jest-environment node
 */
import { migrateUserDatabase } from '../../data/migrations/userDatabaseMigrations';
import { createProfileRepository } from '../../data/repositories/profileRepository';
import { createWordListRepository } from '../../data/repositories/wordListRepository';
import { createWordRepository } from '../../data/repositories/wordRepository';
import { createInMemoryDatabase } from '../../data/testing/nodeSqlDatabase';
import { FrequencyTier } from '../../domain/frequencyTier';
import { LanguageId } from '../../domain/language';
import type { CharacterPartServices } from '../characterParts';
import {
  addCharacterParts,
  alreadyAddedNote,
  bulkCharacterPartsQuestion,
  characterPartLabel,
  findBulkCharacterParts,
  findCharacterParts,
  partsToAdd,
} from '../characterParts';
import type { DictionaryEntry } from '../dictionaryLookup';

const DICTIONARY: Record<string, DictionaryEntry> = {
  雜: {
    headword: '雜',
    reading: 'za2',
    definitionCandidates: [{ text: 'mixed', partsOfSpeech: [] }],
  },
  貨: {
    headword: '貨',
    reading: 'huo4',
    definitionCandidates: [{ text: 'goods', partsOfSpeech: [] }],
  },
  店: {
    headword: '店',
    reading: 'dian4',
    definitionCandidates: [{ text: 'shop', partsOfSpeech: [] }],
  },
  書: {
    headword: '書',
    reading: 'shu1',
    definitionCandidates: [{ text: 'book', partsOfSpeech: [] }],
  },
};

async function setUp() {
  const database = createInMemoryDatabase();
  await migrateUserDatabase(database);
  const profile = await createProfileRepository(database).createProfile(
    'Me',
    LanguageId.MandarinTraditional,
  );
  const wordRepository = createWordRepository(database);
  const services: CharacterPartServices = {
    profileId: profile.id,
    isLanguageCharacter: (character) => /\p{Script=Han}/u.test(character),
    lookUp: async (headword) => (DICTIONARY[headword] ? [DICTIONARY[headword]] : []),
    wordRepository,
    wordListRepository: createWordListRepository(database),
  };
  const addWord = (headword: string, reading: string) =>
    wordRepository.findOrCreateWord({
      profileId: profile.id,
      headword,
      reading,
      definitions: ['x'],
    });
  return { services, addWord };
}

async function generalVocabularyHeadwords(services: CharacterPartServices) {
  const summaries = await services.wordListRepository.listSummaries(services.profileId);
  const general = summaries.find(({ list }) => list.name === 'General Vocabulary');
  const list = await services.wordListRepository.getListWithEntries(general?.list.id ?? 0);
  return (list?.words.map((entry) => entry.word.headword) ?? []).sort();
}

describe('characterParts', () => {
  it('marks characters the profile already has and skips unknown ones', async () => {
    const { services, addWord } = await setUp();
    await addWord('店', 'dian4');
    const parts = await findCharacterParts(services, '雜貨店舖');
    expect(parts.map((part) => [part.character, part.existingWord?.headword])).toEqual([
      ['雜', undefined],
      ['貨', undefined],
      ['店', '店'],
    ]);
    expect(partsToAdd(parts).map((part) => part.character)).toEqual(['雜', '貨']);
  });

  it('adds only the chosen characters to General Vocabulary and links all known parts', async () => {
    const { services, addWord } = await setUp();
    const existingShop = await addWord('店', 'dian4');
    const compound = await addWord('雜貨店', 'za2 huo4 dian4');
    const parts = await findCharacterParts(services, compound.headword);
    const added = await addCharacterParts(
      services,
      [{ compoundWordId: compound.id, parts }],
      new Set(['雜']),
    );
    expect(added.map((word) => [word.headword, word.definitions])).toEqual([['雜', ['mixed']]]);
    expect(await generalVocabularyHeadwords(services)).toEqual(['雜']);
    const linked = await services.wordRepository.listWordParts(compound.id);
    expect(linked.map((word) => word.id)).toEqual([added[0].id, existingShop.id]);
  });

  it('adds a character shared by several compounds once in a bulk add', async () => {
    const { services, addWord } = await setUp();
    const grocery = await addWord('雜貨店', 'za2 huo4 dian4');
    const bookshop = await addWord('書店', 'shu1 dian4');
    const bulk = await findBulkCharacterParts(services, [grocery, bookshop]);
    expect([...bulk.newCharacters]).toEqual(['雜', '貨', '店', '書']);
    const added = await addCharacterParts(services, bulk.compounds, bulk.newCharacters);
    expect(added).toHaveLength(4);
    expect(await generalVocabularyHeadwords(services)).toEqual(['店', '書', '貨', '雜'].sort());
    const bookshopParts = await services.wordRepository.listWordParts(bookshop.id);
    expect(bookshopParts.map((word) => word.headword)).toEqual(['書', '店']);
  });
});

describe('character part text', () => {
  const formatReading = (reading: string) => `[${reading}]`;

  it('labels a character with its reading and first meaning', () => {
    const part = { character: '雜', position: 0, entry: DICTIONARY['雜'] };
    expect(characterPartLabel(part, formatReading)).toBe('雜 [za2]: mixed');
  });

  it('lists characters already in the profile', () => {
    const shop = { id: 1, profileId: 1, headword: '店', reading: 'dian4', definitions: [] };
    const existing = {
      character: '店',
      position: 2,
      existingWord: { ...shop, frequencyTier: FrequencyTier.HighIncidence },
    };
    expect(alreadyAddedNote([existing])).toBe('店 is already in your words.');
    expect(alreadyAddedNote([])).toBeNull();
  });

  it('asks once about a bulk add', () => {
    expect(bulkCharacterPartsQuestion(34)).toBe(
      'Also add 34 individual characters from the new nouns to General Vocabulary, to study on their own?',
    );
  });
});
