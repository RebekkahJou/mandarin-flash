import { PART_OF_SPEECH_FLAGS, PartOfSpeech } from '../../src/domain/partOfSpeech';

/**
 * CC-CEDICT has no part-of-speech tags, so they are guessed from the English glosses.
 * A wrong guess only causes an extra "add anyway?" confirmation (or a missing one), so simple
 * rules are enough. Anything the rules don't recognize is guessed to be a noun, so the rules
 * below exist mostly to stop small grammatical words from counting as nouns.
 */

const NO_PART_OF_SPEECH = 0;

const NO_PART_OF_SPEECH_PREFIXES =
  /^(surname |interjection|abbr\.|abbr |\(onom\.\)|onomatopoeia|prefix|suffix|used in |variant of|see )/i;
const MEASURE_WORD_PREFIXES = /^\(?(classifier|measure word)/i;
const PARTICLE_PREFIXES = /^\(?(modal )?particle/i;

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

/** Chinese treats these as verbs (能願動詞), e.g. 應 "should", 可 "can; may", 會 "will". */
// prettier-ignore
const MODAL_VERB_PHRASES = new Set([
  'should', 'must', 'ought to', 'can', 'could', 'may', 'might', 'will', 'would', 'shall',
  'need to', 'have to', 'has to', 'able to', 'be able to', 'want to', 'would like to', 'dare',
]);

/** Whole glosses that are set phrases rather than any one part of speech, e.g. 謝謝 "thank you". */
// prettier-ignore
const SET_EXPRESSIONS = new Set([
  'thanks', 'thank you', 'sorry', 'hello', 'hi', 'goodbye', 'bye', 'please', 'excuse me',
  'you are welcome', "you're welcome", 'ok', 'okay', 'yes', 'no', 'all', 'each', 'every', 'both',
]);

// prettier-ignore
const FUNCTION_WORD_CLASSES: readonly (readonly [PartOfSpeech, ReadonlySet<string>])[] = [
  [PartOfSpeech.Conjunction, new Set([
    'and', 'or', 'but', 'however', 'because', 'so', 'therefore', 'although', 'though', 'if',
    'unless', 'otherwise', 'moreover', 'furthermore', 'whereas', 'while', 'yet', 'nevertheless',
  ])],
  [PartOfSpeech.Preposition, new Set([
    'from', 'through', 'at', 'in', 'on', 'to', 'with', 'by', 'for', 'of', 'about', 'toward',
    'towards', 'until', 'since', 'than', 'via', 'along', 'across', 'according to', 'compared with',
  ])],
  [PartOfSpeech.Pronoun, new Set([
    'i', 'me', 'you', 'he', 'him', 'she', 'her', 'it', 'we', 'us', 'they', 'them', 'this', 'that',
    'these', 'those', 'myself', 'yourself', 'himself', 'herself', 'oneself', 'ourselves', 'my',
    'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
  ])],
  [PartOfSpeech.QuestionWord, new Set([
    'what', 'who', 'whom', 'whose', 'why', 'how', 'where', 'when', 'which', 'how many', 'how much',
  ])],
  [PartOfSpeech.Numeral, new Set([
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'hundred', 'thousand', 'ten thousand', 'million', 'hundred million', 'half',
  ])],
  [PartOfSpeech.Adverb, new Set([
    'very', 'also', 'not', 'already', 'again', 'only', 'still', 'just', 'together', 'here',
    'there', 'now', 'then', 'too', 'even', 'never', 'always', 'often', 'soon', 'once', 'quite',
  ])],
];

const TRAILING_PUNCTUATION = /[?!.]+$/;
const DIGITS = /^\d+$/;
/** Notes such as "-able" in "can; may; able to; -able" describe the word, not a meaning. */
const SUFFIX_NOTE = /^-/;

function headWords(gloss: string): string[] {
  return gloss
    .replace(/\([^)]*\)/g, ' ')
    .split(/[;,]/)
    .map((part) => part.trim().toLowerCase().replace(TRAILING_PUNCTUATION, ''))
    .filter((part) => part.length > 0);
}

function isAdjectivePhrase(phrase: string): boolean {
  const words = phrase.split(/\s+/);
  const lastWord = words[words.length - 1];
  if (words.length === 1) return COMMON_ADJECTIVES.has(lastWord) || ADJECTIVE_SUFFIX.test(lastWord);
  // "very good", "not bad": an adverb followed by an adjective.
  return words.length === 2 && COMMON_ADJECTIVES.has(lastWord);
}

/** The flag for a small grammatical word or set phrase; undefined for anything else. */
function functionWordFlag(phrase: string): number | undefined {
  if (SET_EXPRESSIONS.has(phrase)) return NO_PART_OF_SPEECH;
  const wordClass = FUNCTION_WORD_CLASSES.find(([, phrases]) => phrases.has(phrase));
  if (wordClass) return PART_OF_SPEECH_FLAGS[wordClass[0]];
  if (DIGITS.test(phrase)) return PART_OF_SPEECH_FLAGS[PartOfSpeech.Numeral];
  return /^\w+ly$/.test(phrase) ? PART_OF_SPEECH_FLAGS[PartOfSpeech.Adverb] : undefined;
}

/** Flags for a gloss made only of grammatical words, e.g. "but; however"; null otherwise. */
function functionWordFlags(phrases: readonly string[]): number | null {
  let flags = NO_PART_OF_SPEECH;
  for (const phrase of phrases) {
    const flag = functionWordFlag(phrase);
    if (flag === undefined) return null;
    flags |= flag;
  }
  return flags;
}

/**
 * True when every meaning in the gloss is a modal such as "should". Capitalized glosses are
 * skipped so "May (month)" stays a noun, and "will; willpower" stays a noun because not every
 * meaning is modal.
 */
function isModalVerbGloss(cleanedGloss: string, phrases: readonly string[]): boolean {
  if (/^[A-Z]/.test(cleanedGloss)) return false;
  const meanings = phrases.filter((phrase) => !SUFFIX_NOTE.test(phrase));
  return meanings.length > 0 && meanings.every((phrase) => MODAL_VERB_PHRASES.has(phrase));
}

/** Labels CC-CEDICT puts at the start of a gloss, before any parenthetical note is removed. */
function labelledFlags(gloss: string): number | null {
  if (MEASURE_WORD_PREFIXES.test(gloss)) return PART_OF_SPEECH_FLAGS[PartOfSpeech.MeasureWord];
  if (PARTICLE_PREFIXES.test(gloss)) return PART_OF_SPEECH_FLAGS[PartOfSpeech.Particle];
  return null;
}

/** Returns a bitmask of PART_OF_SPEECH_FLAGS for one English gloss. */
export function tagGloss(gloss: string, entryHasClassifier: boolean): number {
  const labelled = labelledFlags(gloss.trim());
  if (labelled !== null) return labelled;
  const cleaned = gloss.replace(/^\([^)]*\)\s*/, '').trim();
  if (!cleaned || NO_PART_OF_SPEECH_PREFIXES.test(cleaned)) return NO_PART_OF_SPEECH;
  if (/^to /i.test(cleaned)) return PART_OF_SPEECH_FLAGS[PartOfSpeech.Verb];
  // Only nouns take measure words, so this outranks the guesses below.
  if (entryHasClassifier) return PART_OF_SPEECH_FLAGS[PartOfSpeech.Noun];
  const phrases = headWords(cleaned);
  if (isModalVerbGloss(cleaned, phrases)) return PART_OF_SPEECH_FLAGS[PartOfSpeech.Verb];
  if (phrases.some(isAdjectivePhrase)) return PART_OF_SPEECH_FLAGS[PartOfSpeech.Adjective];
  return functionWordFlags(phrases) ?? PART_OF_SPEECH_FLAGS[PartOfSpeech.Noun];
}
