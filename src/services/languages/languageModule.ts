import type { LanguageDefinition } from '../../domain/language';
import type { CsvHeaderNames } from '../csvFormat';

/** Language-specific text handling. Each language gets one; callers never branch on language. */
export interface LanguageModule {
  definition: LanguageDefinition;
  /** Header names written on export and accepted on import, e.g. "character" for the headword. */
  csvHeaders: CsvHeaderNames;
  /** Converts typed or imported text to the stored headword form, e.g. Simplified to Traditional. */
  normalizeHeadword(text: string): string;
  /** True when the text has at least one character of the language's script. */
  containsLanguageScript(text: string): boolean;
  /** Converts a reading as the user typed it to the stored form, e.g. "nǐ hǎo" to "ni3 hao3". */
  normalizeReading(reading: string): string;
  /** A stored reading as shown in labels and exported files, e.g. "ni3 hao3" to "nǐ hǎo". */
  formatReading(storedReading: string): string;
  /** Folds a reading or search query so loosely typed queries still match (e.g. ignoring tones). */
  readingSearchKey(text: string): string;
}
