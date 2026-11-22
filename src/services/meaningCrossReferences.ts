/**
 * CC-CEDICT meanings point to other words as Traditional|Simplified[pinyin], e.g.
 * "one tenth of a tael 兩|两[liang3]", and give other readings as "also pr. [pou1]". This turns
 * them into readable text for the profile's script: "one tenth of a tael 兩 (liǎng)",
 * "also pr. pōu".
 */
import { toToneMarkedPinyin } from './pinyin';

/** A written form: Han characters, possibly with digits or Latin letters (95後, B型超聲). */
const WRITTEN_FORM = String.raw`[0-9A-Za-z]*\p{Script=Han}[\p{Script=Han}0-9A-Za-z]*`;

/** A written form, then optionally "|" and the other script's form, then optionally [pinyin]. */
const CROSS_REFERENCE = new RegExp(
  String.raw`(${WRITTEN_FORM})(?:\|(${WRITTEN_FORM}))?(?:\[([^\]]*)\])?`,
  'gu',
);

/** Numbered pinyin on its own in brackets, e.g. [pou1] or [yi1mo2-yi1yang4]. */
const BRACKETED_READING = /\[([A-Za-z:]+[1-5](?:[ -]?[A-Za-z:]+[1-5])*)\]/g;

/** Splits run-together or hyphenated syllables so each gets its tone mark. */
function toneMarked(numberedPinyin: string): string {
  const syllables = numberedPinyin.trim().replace(/([1-5])-?(?=[A-Za-z])/g, '$1 ');
  return toToneMarkedPinyin(syllables);
}

export function formatCrossReferences(meaning: string, readsVariants: boolean): string {
  return meaning
    .replace(
      CROSS_REFERENCE,
      (match, traditional: string, simplified?: string, numberedPinyin?: string) => {
        if (simplified === undefined && numberedPinyin === undefined) return match;
        const characters = readsVariants && simplified ? simplified : traditional;
        if (!numberedPinyin?.trim()) return characters;
        return `${characters} (${toneMarked(numberedPinyin)})`;
      },
    )
    .replace(BRACKETED_READING, (_match, numberedPinyin: string) => toneMarked(numberedPinyin));
}
