import { LanguageId } from '../language';
import type { PackMetadata } from '../packMetadata';
import {
  PackMetadataKey,
  PackRejectedError,
  packMetadataRows,
  parsePackMetadata,
  supportedLanguageIdsOf,
} from '../packMetadata';
import { PartOfSpeech } from '../partOfSpeech';

const FORMAT = 'test-format';

const METADATA: PackMetadata = {
  packId: 'mandarin',
  packVersion: 3,
  schemaVersion: 1,
  title: 'Mandarin',
  languageIds: [LanguageId.MandarinTraditional, 'de'],
  reliablePartsOfSpeech: [PartOfSpeech.Noun],
  licenses: [{ name: 'CC-CEDICT', usage: 'Meanings', license: 'CC BY-SA 4.0', source: 'mdbg.net' }],
};

function valuesWith(changes: Partial<Record<PackMetadataKey, string>>): Map<string, string> {
  const values = new Map<string, string>(packMetadataRows(METADATA, FORMAT));
  for (const [key, value] of Object.entries(changes)) values.set(key, value);
  return values;
}

describe('parsePackMetadata', () => {
  it('reads back what packMetadataRows wrote', () => {
    expect(parsePackMetadata(valuesWith({}), FORMAT)).toEqual(METADATA);
  });

  it('skips word types this app version does not know', () => {
    const values = valuesWith({
      [PackMetadataKey.ReliablePartsOfSpeech]: '["noun","interjection"]',
    });
    expect(parsePackMetadata(values, FORMAT).reliablePartsOfSpeech).toEqual([PartOfSpeech.Noun]);
  });

  it.each([
    ['another format', { [PackMetadataKey.Format]: 'other' }],
    ['a pack id with unsafe characters', { [PackMetadataKey.PackId]: '../mandarin' }],
    ['a version that is not a positive integer', { [PackMetadataKey.PackVersion]: '1.5' }],
    ['an empty title', { [PackMetadataKey.Title]: '' }],
    ['no languages', { [PackMetadataKey.LanguageIds]: '[]' }],
    ['a language id with unsafe characters', { [PackMetadataKey.LanguageIds]: '["zh Hant"]' }],
    ['licenses that are not JSON', { [PackMetadataKey.Licenses]: '{' }],
    ['a license missing its source', { [PackMetadataKey.Licenses]: '[{"name":"x"}]' }],
  ])('rejects %s', (_description, changes) => {
    expect(() => parsePackMetadata(valuesWith(changes), FORMAT)).toThrow(PackRejectedError);
  });

  it('rejects missing values', () => {
    const values = valuesWith({});
    values.delete(PackMetadataKey.PackVersion);
    expect(() => parsePackMetadata(values, FORMAT)).toThrow(PackRejectedError);
  });
});

describe('supportedLanguageIdsOf', () => {
  it('keeps only languages this app version can teach', () => {
    expect(supportedLanguageIdsOf(METADATA)).toEqual([LanguageId.MandarinTraditional]);
  });
});
