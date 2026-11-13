/**
 * Zhuyin study cards: the 37 zhuyin symbols and the tone marks. Each card shows a symbol; its
 * reading is an example character's, and its meanings give the sound and the example
 * (ㄅ: "b", "as in 八 bā"). The table is small and fixed, so it lives in code, not in a pack.
 */

interface ZhuyinStudyCard {
  symbol: string;
  /** What the symbol sounds like, in pinyin terms. */
  sound: string;
  /** An everyday Traditional character using it, and that character's numbered pinyin. */
  example: string;
  exampleReading: string;
}

export const ZHUYIN_STUDY_LIST_NAME = 'Zhuyin';

export const ZHUYIN_STUDY_CARDS: readonly ZhuyinStudyCard[] = [
  { symbol: 'ㄅ', sound: 'b', example: '八', exampleReading: 'ba1' },
  { symbol: 'ㄆ', sound: 'p', example: '爬', exampleReading: 'pa2' },
  { symbol: 'ㄇ', sound: 'm', example: '媽', exampleReading: 'ma1' },
  { symbol: 'ㄈ', sound: 'f', example: '飛', exampleReading: 'fei1' },
  { symbol: 'ㄉ', sound: 'd', example: '大', exampleReading: 'da4' },
  { symbol: 'ㄊ', sound: 't', example: '他', exampleReading: 'ta1' },
  { symbol: 'ㄋ', sound: 'n', example: '你', exampleReading: 'ni3' },
  { symbol: 'ㄌ', sound: 'l', example: '來', exampleReading: 'lai2' },
  { symbol: 'ㄍ', sound: 'g', example: '哥', exampleReading: 'ge1' },
  { symbol: 'ㄎ', sound: 'k', example: '口', exampleReading: 'kou3' },
  { symbol: 'ㄏ', sound: 'h', example: '好', exampleReading: 'hao3' },
  { symbol: 'ㄐ', sound: 'j', example: '家', exampleReading: 'jia1' },
  { symbol: 'ㄑ', sound: 'q', example: '去', exampleReading: 'qu4' },
  { symbol: 'ㄒ', sound: 'x', example: '小', exampleReading: 'xiao3' },
  { symbol: 'ㄓ', sound: 'zh', example: '中', exampleReading: 'zhong1' },
  { symbol: 'ㄔ', sound: 'ch', example: '吃', exampleReading: 'chi1' },
  { symbol: 'ㄕ', sound: 'sh', example: '是', exampleReading: 'shi4' },
  { symbol: 'ㄖ', sound: 'r', example: '日', exampleReading: 'ri4' },
  { symbol: 'ㄗ', sound: 'z', example: '字', exampleReading: 'zi4' },
  { symbol: 'ㄘ', sound: 'c', example: '菜', exampleReading: 'cai4' },
  { symbol: 'ㄙ', sound: 's', example: '四', exampleReading: 'si4' },
  { symbol: 'ㄧ', sound: 'i (yi on its own)', example: '一', exampleReading: 'yi1' },
  { symbol: 'ㄨ', sound: 'u (wu on its own)', example: '五', exampleReading: 'wu3' },
  { symbol: 'ㄩ', sound: 'ü (yu on its own)', example: '魚', exampleReading: 'yu2' },
  { symbol: 'ㄚ', sound: 'a', example: '啊', exampleReading: 'a1' },
  { symbol: 'ㄛ', sound: 'o', example: '喔', exampleReading: 'o1' },
  { symbol: 'ㄜ', sound: 'e', example: '餓', exampleReading: 'e4' },
  { symbol: 'ㄝ', sound: 'ê (the e in ie, ye)', example: '也', exampleReading: 'ye3' },
  { symbol: 'ㄞ', sound: 'ai', example: '愛', exampleReading: 'ai4' },
  { symbol: 'ㄟ', sound: 'ei', example: '黑', exampleReading: 'hei1' },
  { symbol: 'ㄠ', sound: 'ao', example: '包', exampleReading: 'bao1' },
  { symbol: 'ㄡ', sound: 'ou', example: '狗', exampleReading: 'gou3' },
  { symbol: 'ㄢ', sound: 'an', example: '安', exampleReading: 'an1' },
  { symbol: 'ㄣ', sound: 'en', example: '門', exampleReading: 'men2' },
  { symbol: 'ㄤ', sound: 'ang', example: '忙', exampleReading: 'mang2' },
  { symbol: 'ㄥ', sound: 'eng', example: '冷', exampleReading: 'leng3' },
  { symbol: 'ㄦ', sound: 'er', example: '二', exampleReading: 'er4' },
  {
    symbol: 'ˉ',
    sound: 'first tone: high and level (usually not written)',
    example: '媽',
    exampleReading: 'ma1',
  },
  { symbol: 'ˊ', sound: 'second tone: rising', example: '麻', exampleReading: 'ma2' },
  { symbol: 'ˇ', sound: 'third tone: dipping', example: '馬', exampleReading: 'ma3' },
  { symbol: 'ˋ', sound: 'fourth tone: falling', example: '罵', exampleReading: 'ma4' },
  { symbol: '˙', sound: 'neutral tone: light and short', example: '嗎', exampleReading: 'ma5' },
];

export interface ZhuyinStudyWord {
  headword: string;
  reading: string;
  definitions: string[];
}

/**
 * The cards as words. Examples are converted to the profile's script (媽 → 妈 for Simplified)
 * and their readings formatted for the "as in" meaning.
 */
export function zhuyinStudyWords(
  convertToScript: (text: string) => string,
  formatReading: (numberedReading: string) => string,
): ZhuyinStudyWord[] {
  return ZHUYIN_STUDY_CARDS.map((card) => ({
    headword: card.symbol,
    reading: card.exampleReading,
    definitions: [
      card.sound,
      `as in ${convertToScript(card.example)} ${formatReading(card.exampleReading)}`,
    ],
  }));
}
