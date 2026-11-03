import { PART_OF_SPEECH_FLAGS, PartOfSpeech } from '../../src/domain/partOfSpeech';

/**
 * CC-CEDICT has no part-of-speech tags, so they are guessed from the English glosses.
 * A wrong guess only causes an extra "add anyway?" confirmation, so simple rules are enough.
 */

const NO_PART_OF_SPEECH = 0;

const FUNCTION_GLOSS_PREFIXES =
  /^(surname |classifier |measure word|particle|interjection|abbr\.|abbr |\(onom\.\)|onomatopoeia|prefix|suffix|used in |variant of|see )/i;

// prettier-ignore
const COMMON_ADJECTIVES = new Set([
  'big', 'small', 'large', 'little', 'tiny', 'huge', 'good', 'bad', 'hot', 'cold', 'warm', 'cool',
  'new', 'old', 'young', 'long', 'short', 'tall', 'high', 'low', 'fast', 'quick', 'slow',
  'happy', 'sad', 'glad', 'angry', 'pretty', 'ugly', 'fat', 'thin', 'heavy', 'light', 'busy',
  'free', 'easy', 'hard', 'difficult', 'simple', 'many', 'much', 'few', 'more', 'less', 'early',
  'late', 'near', 'far', 'close', 'clean', 'dirty', 'right', 'wrong', 'correct', 'true', 'false',
  'red', 'blue', 'green', 'yellow', 'white', 'black', 'purple', 'pink', 'brown', 'gray', 'grey',
  'bright', 'dark', 'rich', 'poor', 'full', 'empty', 'wet', 'dry', 'sweet', 'sour', 'bitter',
  'salty', 'spicy', 'tasty', 'delicious', 'expensive', 'cheap', 'safe', 'strong', 'weak',
  'soft', 'thick', 'deep', 'shallow', 'wide', 'narrow', 'smart', 'clever', 'stupid', 'kind',
  'polite', 'lazy', 'tired', 'sleepy', 'hungry', 'thirsty', 'sick', 'ill', 'healthy', 'well',
  'fine', 'nice', 'great', 'cute', 'quiet', 'loud', 'noisy', 'calm', 'same', 'different',
  'important', 'necessary', 'possible', 'real', 'whole', 'main', 'common', 'special', 'strange',
  'familiar', 'convenient', 'comfortable', 'interesting', 'boring', 'fun', 'funny', 'serious',
  'careful', 'beautiful', 'handsome', 'friendly', 'honest', 'brave', 'proud', 'shy', 'nervous',
  'anxious', 'worried', 'excited', 'satisfied', 'popular', 'famous', 'modern', 'ancient',
]);

const ADJECTIVE_SUFFIX = /(ful|ous|ive|able|ible|less|ish|ical)$/;

// prettier-ignore
const NON_NOUN_WORDS = new Set([
  'from', 'through', 'away', 'very', 'also', 'not', 'already', 'again', 'only', 'still', 'just',
  'and', 'or', 'but', 'if', 'because', 'so', 'then', 'together', 'here', 'there', 'now', 'all',
  'each', 'every', 'both', 'at', 'in', 'on', 'to', 'with', 'by', 'for', 'of', 'about', 'yes', 'no',
]);

function headWords(gloss: string): string[] {
  return gloss
    .replace(/\([^)]*\)/g, ' ')
    .split(/[;,]/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);
}

function isAdjectivePhrase(phrase: string): boolean {
  const words = phrase.split(/\s+/);
  const lastWord = words[words.length - 1];
  if (words.length === 1) return COMMON_ADJECTIVES.has(lastWord) || ADJECTIVE_SUFFIX.test(lastWord);
  // "very good", "not bad": an adverb followed by an adjective.
  return words.length === 2 && COMMON_ADJECTIVES.has(lastWord);
}

/** Returns a bitmask of PART_OF_SPEECH_FLAGS for one English gloss. */
export function tagGloss(gloss: string, entryHasClassifier: boolean): number {
  const cleaned = gloss.replace(/^\([^)]*\)\s*/, '').trim();
  if (!cleaned || FUNCTION_GLOSS_PREFIXES.test(cleaned)) return NO_PART_OF_SPEECH;
  if (/^to /i.test(cleaned)) return PART_OF_SPEECH_FLAGS[PartOfSpeech.Verb];
  // Only nouns take measure words, so this outranks the adjective guesses below.
  if (entryHasClassifier) return PART_OF_SPEECH_FLAGS[PartOfSpeech.Noun];
  const phrases = headWords(cleaned);
  if (phrases.some(isAdjectivePhrase)) return PART_OF_SPEECH_FLAGS[PartOfSpeech.Adjective];
  const isFunctionWord = phrases.every(
    (phrase) => NON_NOUN_WORDS.has(phrase) || /ly$/.test(phrase),
  );
  return isFunctionWord ? NO_PART_OF_SPEECH : PART_OF_SPEECH_FLAGS[PartOfSpeech.Noun];
}
