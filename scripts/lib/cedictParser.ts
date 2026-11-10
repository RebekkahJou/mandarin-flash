export interface CedictEntry {
  traditional: string;
  simplified: string;
  /** Numbered-tone pinyin, using the Taiwan pronunciation when CC-CEDICT lists one for the whole word. */
  pinyin: string;
  /** CC-CEDICT's main (mainland) pinyin; differs from pinyin only when a Taiwan one is listed. */
  mainlandPinyin: string;
  glosses: string[];
  /** CC-CEDICT lists measure words ("CL:") only for nouns. */
  hasClassifier: boolean;
}

const LINE_PATTERN = /^(\S+) (\S+) \[([^\]]+)\] \/(.*)\/$/;
const WHOLE_WORD_TAIWAN_PRONUNCIATION = /^Taiwan pr\. \[([^\]]+)\]$/;
const CLASSIFIER_GLOSS = /^CL:/;
const LOW_VALUE_LABELS = /^\((bound form|literary)\)\s*/;

/** "xia4hai2" → "xia4 hai2" (some Taiwan pronunciations omit the spaces). */
export function spaceSyllables(pinyin: string): string {
  return pinyin.replace(/([1-5])(?=[a-zA-Z])/g, '$1 ').trim();
}

export function parseCedictLine(line: string): CedictEntry | null {
  if (line.startsWith('#')) return null;
  const match = LINE_PATTERN.exec(line.trim());
  if (!match) return null;
  const [, traditional, simplified, pinyin, glossText] = match;
  let taiwanPinyin: string | undefined;
  let hasClassifier = false;
  const glosses: string[] = [];
  for (const rawGloss of glossText.split('/')) {
    const taiwanMatch = WHOLE_WORD_TAIWAN_PRONUNCIATION.exec(rawGloss);
    if (taiwanMatch) {
      taiwanPinyin = spaceSyllables(taiwanMatch[1]);
    } else if (CLASSIFIER_GLOSS.test(rawGloss)) {
      hasClassifier = true;
    } else if (rawGloss.trim()) {
      glosses.push(rawGloss.replace(LOW_VALUE_LABELS, '').trim());
    }
  }
  return {
    traditional,
    simplified,
    pinyin: taiwanPinyin ?? pinyin,
    mainlandPinyin: pinyin,
    glosses,
    hasClassifier,
  };
}

const NON_DEFINITION_GLOSS =
  /^(variant of|old variant of|see |used in |also written|archaic variant)/i;

/** Drops cross-reference entries ("variant of X", "see X") that would only clutter the app. */
export function isCrossReferenceOnly(entry: CedictEntry): boolean {
  return entry.glosses.every((gloss) => NON_DEFINITION_GLOSS.test(gloss));
}

const TAIWAN_USAGE_LABEL = /^\(Tw\)/;

/** Meaningful glosses, with Taiwan-specific usages first (軟體 → "software" before "soft-bodied"). */
export function usefulGlosses(entry: CedictEntry): string[] {
  const glosses = entry.glosses.filter((gloss) => !NON_DEFINITION_GLOSS.test(gloss));
  const taiwanGlosses = glosses.filter((gloss) => TAIWAN_USAGE_LABEL.test(gloss));
  const otherGlosses = glosses.filter((gloss) => !TAIWAN_USAGE_LABEL.test(gloss));
  return [...taiwanGlosses, ...otherGlosses];
}
