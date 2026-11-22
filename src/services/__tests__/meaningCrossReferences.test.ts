import { formatCrossReferences } from '../meaningCrossReferences';

describe('formatCrossReferences', () => {
  it('shows the profile script and tone-marked pinyin', () => {
    const meaning = 'unit of weight, one tenth of a tael 兩|两[liang3]';
    expect(formatCrossReferences(meaning, false)).toBe(
      'unit of weight, one tenth of a tael 兩 (liǎng)',
    );
    expect(formatCrossReferences(meaning, true)).toBe(
      'unit of weight, one tenth of a tael 两 (liǎng)',
    );
  });

  it('handles references without a second form, inside brackets and with capitals', () => {
    expect(formatCrossReferences('(after 得[de2]) unbearably', false)).toBe(
      '(after 得 (dé)) unbearably',
    );
    expect(formatCrossReferences('Li Bai 李白[Li3 Bai2] and Du Fu 杜甫[Du4 Fu3]', false)).toBe(
      'Li Bai 李白 (Lǐ Bái) and Du Fu 杜甫 (Dù Fǔ)',
    );
  });

  it('handles forms with digits or Latin letters and readings on their own', () => {
    expect(formatCrossReferences('abbr. for B型超聲|B型超声[B xing2 chao1 sheng1]', true)).toBe(
      'abbr. for B型超声 (B xíng chāo shēng)',
    );
    expect(formatCrossReferences('also pr. [pou1]', false)).toBe('also pr. pōu');
    expect(formatCrossReferences('also pr. [yi1mo2-yi1yang4]', false)).toBe(
      'also pr. yī mó yī yàng',
    );
  });

  it('drops the other form when there is no pinyin', () => {
    expect(formatCrossReferences('abbr. for 三項全能|三项全能', true)).toBe('abbr. for 三项全能');
  });

  it('leaves plain characters and meanings without references alone', () => {
    expect(formatCrossReferences('benevolence 仁', false)).toBe('benevolence 仁');
    expect(formatCrossReferences('money', false)).toBe('money');
  });
});
