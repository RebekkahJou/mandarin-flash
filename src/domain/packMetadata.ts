import type { LanguageId } from './language';
import { isLanguageId } from './language';
import type { PartOfSpeech } from './partOfSpeech';
import { isPartOfSpeech } from './partOfSpeech';

/** Keys of a pack's pack_metadata table. Values are text; lists and records are JSON. */
export enum PackMetadataKey {
  Format = 'format',
  SchemaVersion = 'schema_version',
  PackId = 'pack_id',
  PackVersion = 'pack_version',
  Title = 'title',
  LanguageIds = 'language_ids',
  ReliablePartsOfSpeech = 'reliable_parts_of_speech',
  Licenses = 'licenses',
}

/** Credit for data or fonts in a pack, shown on the About screen. */
export interface PackLicense {
  name: string;
  usage: string;
  license: string;
  source: string;
}

export interface PackMetadata {
  /** Stable id such as "mandarin"; a newer version of the same pack replaces the older one. */
  packId: string;
  packVersion: number;
  schemaVersion: number;
  title: string;
  /** Languages the pack serves; one pack can serve several (Traditional and Simplified). */
  languageIds: string[];
  /** Word types the pack tags well enough to warn when a word doesn't fit a list. */
  reliablePartsOfSpeech: PartOfSpeech[];
  licenses: PackLicense[];
}

/** A pack that can't be used. The message is shown to the user as is. */
export class PackRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PackRejectedError';
  }
}

const PACK_ID_PATTERN = /^[a-z0-9-]{1,40}$/;
const LANGUAGE_ID_PATTERN = /^[A-Za-z0-9-]{2,20}$/;
const MAX_TITLE_LENGTH = 60;
const MAX_LICENSE_FIELD_LENGTH = 200;
const MAX_LICENSES = 20;
const MAX_LANGUAGES_PER_PACK = 10;
const DAMAGED_PACK_MESSAGE = 'This language pack is damaged. Download it again.';

function reject(): never {
  throw new PackRejectedError(DAMAGED_PACK_MESSAGE);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return reject();
  }
}

function positiveInteger(text: string | undefined): number {
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < 1) reject();
  return value;
}

function boundedText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) reject();
  return value;
}

function stringList(text: string | undefined, maxItems: number): string[] {
  const value = parseJson(text ?? '');
  if (!Array.isArray(value) || value.length > maxItems) reject();
  return value.map((item) => boundedText(item, MAX_LICENSE_FIELD_LENGTH));
}

function parseLicense(value: unknown): PackLicense {
  if (typeof value !== 'object' || value === null) reject();
  const record = value as Record<string, unknown>;
  return {
    name: boundedText(record.name, MAX_LICENSE_FIELD_LENGTH),
    usage: boundedText(record.usage, MAX_LICENSE_FIELD_LENGTH),
    license: boundedText(record.license, MAX_LICENSE_FIELD_LENGTH),
    source: boundedText(record.source, MAX_LICENSE_FIELD_LENGTH),
  };
}

function parseLicenses(text: string | undefined): PackLicense[] {
  const value = parseJson(text ?? '');
  if (!Array.isArray(value) || value.length > MAX_LICENSES) reject();
  return value.map(parseLicense);
}

function parseLanguageIds(text: string | undefined): string[] {
  const languageIds = stringList(text, MAX_LANGUAGES_PER_PACK);
  if (languageIds.length === 0) reject();
  if (!languageIds.every((languageId) => LANGUAGE_ID_PATTERN.test(languageId))) reject();
  return languageIds;
}

function parsePartsOfSpeech(text: string | undefined): PartOfSpeech[] {
  // Word types this app version doesn't know are skipped, so newer packs still install.
  return stringList(text, Number.MAX_SAFE_INTEGER).filter(isPartOfSpeech);
}

/**
 * Reads pack_metadata rows (key → value). Packs are untrusted, so every value is checked and
 * anything malformed rejects the whole pack.
 */
export function parsePackMetadata(
  values: ReadonlyMap<string, string>,
  expectedFormatName: string,
): PackMetadata {
  if (values.get(PackMetadataKey.Format) !== expectedFormatName) reject();
  const packId = values.get(PackMetadataKey.PackId) ?? '';
  if (!PACK_ID_PATTERN.test(packId)) reject();
  return {
    packId,
    packVersion: positiveInteger(values.get(PackMetadataKey.PackVersion)),
    schemaVersion: positiveInteger(values.get(PackMetadataKey.SchemaVersion)),
    title: boundedText(values.get(PackMetadataKey.Title), MAX_TITLE_LENGTH),
    languageIds: parseLanguageIds(values.get(PackMetadataKey.LanguageIds)),
    reliablePartsOfSpeech: parsePartsOfSpeech(values.get(PackMetadataKey.ReliablePartsOfSpeech)),
    licenses: parseLicenses(values.get(PackMetadataKey.Licenses)),
  };
}

/** pack_metadata rows for a pack, as written by the pack build scripts. */
export function packMetadataRows(
  metadata: PackMetadata,
  formatName: string,
): [key: PackMetadataKey, value: string][] {
  return [
    [PackMetadataKey.Format, formatName],
    [PackMetadataKey.SchemaVersion, String(metadata.schemaVersion)],
    [PackMetadataKey.PackId, metadata.packId],
    [PackMetadataKey.PackVersion, String(metadata.packVersion)],
    [PackMetadataKey.Title, metadata.title],
    [PackMetadataKey.LanguageIds, JSON.stringify(metadata.languageIds)],
    [PackMetadataKey.ReliablePartsOfSpeech, JSON.stringify(metadata.reliablePartsOfSpeech)],
    [PackMetadataKey.Licenses, JSON.stringify(metadata.licenses)],
  ];
}

/**
 * Credits for every open pack, each listed once: an installed update of a pack usually credits
 * the same sources as the built-in version it replaces.
 */
export function distinctLicensesOf(packs: readonly PackMetadata[]): PackLicense[] {
  const seen = new Set<string>();
  return packs
    .flatMap((metadata) => metadata.licenses)
    .filter((license) => {
      const identity = JSON.stringify([license.name, license.license, license.source]);
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
}

/** The pack's languages this app version can teach. */
export function supportedLanguageIdsOf(metadata: PackMetadata): LanguageId[] {
  return metadata.languageIds.filter(isLanguageId);
}
