import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../ui/components/ScreenContainer';
import { SectionTitle } from '../ui/components/SectionTitle';
import { colors, fontSizes, radii, spacing } from '../ui/theme';

interface ThirdPartyNotice {
  name: string;
  usage: string;
  license: string;
  source: string;
}

/** Keep in sync with docs/THIRD_PARTY.md. */
const THIRD_PARTY_NOTICES: readonly ThirdPartyNotice[] = [
  {
    name: 'CC-CEDICT',
    usage: 'Dictionary meanings and pinyin',
    license: 'Creative Commons Attribution-ShareAlike 4.0',
    source: 'mdbg.net/chinese/dictionary?page=cc-cedict',
  },
  {
    name: 'Tatoeba',
    usage: 'Example sentences',
    license: 'Creative Commons Attribution 2.0 France',
    source: 'tatoeba.org',
  },
  {
    name: 'Noto Serif TC',
    usage: 'Flashcard font (subset)',
    license: 'SIL Open Font License 1.1',
    source: 'github.com/notofonts/noto-cjk',
  },
  {
    name: 'LXGW WenKai TC',
    usage: 'Flashcard font (subset)',
    license: 'SIL Open Font License 1.1',
    source: 'github.com/lxgw/LxgwWenkaiTC',
  },
  {
    name: 'jf open-huninn (jf open 粉圓)',
    usage: 'Flashcard font (subset)',
    license: 'SIL Open Font License 1.1',
    source: 'github.com/justfont/open-huninn-font',
  },
  {
    name: 'OpenCC (opencc-js)',
    usage: 'Conversion between Simplified and Traditional characters',
    license: 'Apache License 2.0 / MIT',
    source: 'github.com/nk2028/opencc-js',
  },
];

export default function AboutScreen() {
  return (
    <ScreenContainer isScrollable>
      <SectionTitle title="Mandarin Flash" />
      <Text style={styles.body}>
        Flashcards for Traditional Chinese as used in Taiwan. All data stays on this device.
      </Text>
      <SectionTitle title="Data and fonts" />
      {THIRD_PARTY_NOTICES.map((notice) => (
        <View key={notice.name} style={styles.notice}>
          <Text style={styles.name}>{notice.name}</Text>
          <Text style={styles.body}>{notice.usage}</Text>
          <Text style={styles.detail}>{notice.license}</Text>
          <Text style={styles.detail}>{notice.source}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: spacing.medium,
    gap: spacing.extraSmall,
  },
  name: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  detail: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
});
