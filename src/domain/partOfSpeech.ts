export enum PartOfSpeech {
  Noun = 'noun',
  Verb = 'verb',
  Adjective = 'adjective',
}

/** Bit flags used by the bundled dictionary's pos_flags column. */
export const PART_OF_SPEECH_FLAGS: Readonly<Record<PartOfSpeech, number>> = {
  [PartOfSpeech.Noun]: 1,
  [PartOfSpeech.Verb]: 2,
  [PartOfSpeech.Adjective]: 4,
};

export function hasPartOfSpeech(posFlags: number, partOfSpeech: PartOfSpeech): boolean {
  return (posFlags & PART_OF_SPEECH_FLAGS[partOfSpeech]) !== 0;
}

export function isPartOfSpeech(value: string): value is PartOfSpeech {
  return (Object.values(PartOfSpeech) as string[]).includes(value);
}
