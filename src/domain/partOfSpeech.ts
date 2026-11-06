/** Values are stored in word_lists.part_of_speech and shown in messages, so they read as English. */
export enum PartOfSpeech {
  Noun = 'noun',
  Verb = 'verb',
  Adjective = 'adjective',
  Adverb = 'adverb',
  Pronoun = 'pronoun',
  Preposition = 'preposition',
  Conjunction = 'conjunction',
  MeasureWord = 'measure word',
  Particle = 'particle',
  Numeral = 'numeral',
  QuestionWord = 'question word',
}

/**
 * Bit flags used by dictionary pos_flags columns. Never renumber a flag: built dictionaries and
 * packs store these bits.
 */
export const PART_OF_SPEECH_FLAGS: Readonly<Record<PartOfSpeech, number>> = {
  [PartOfSpeech.Noun]: 1,
  [PartOfSpeech.Verb]: 2,
  [PartOfSpeech.Adjective]: 4,
  [PartOfSpeech.Adverb]: 8,
  [PartOfSpeech.Pronoun]: 16,
  [PartOfSpeech.Preposition]: 32,
  [PartOfSpeech.Conjunction]: 64,
  [PartOfSpeech.MeasureWord]: 128,
  [PartOfSpeech.Particle]: 256,
  [PartOfSpeech.Numeral]: 512,
  [PartOfSpeech.QuestionWord]: 1024,
};

export function hasPartOfSpeech(posFlags: number, partOfSpeech: PartOfSpeech): boolean {
  return (posFlags & PART_OF_SPEECH_FLAGS[partOfSpeech]) !== 0;
}

export function isPartOfSpeech(value: string): value is PartOfSpeech {
  return (Object.values(PartOfSpeech) as string[]).includes(value);
}
