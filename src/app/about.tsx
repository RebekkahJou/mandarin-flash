import { StyleSheet, Text } from 'react-native';

import type { PackLicense } from '../domain/packMetadata';
import { LicenseNotices } from '../ui/components/LicenseNotices';
import { ScreenContainer } from '../ui/components/ScreenContainer';
import { SectionTitle } from '../ui/components/SectionTitle';
import { useLanguagePacks } from '../ui/LanguagePacksContext';
import { colors, fontSizes } from '../ui/theme';

/**
 * Fonts and code inside the app itself. Each language pack lists its own data sources, shown
 * above these. Keep in sync with docs/THIRD_PARTY.md.
 */
const APP_THIRD_PARTY_NOTICES: readonly PackLicense[] = [
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
  {
    name: 'noble-ed25519',
    usage: 'Checking that language packs are genuine',
    license: 'MIT License',
    source: 'github.com/paulmillr/noble-ed25519',
  },
];

export default function AboutScreen() {
  const { packs } = useLanguagePacks();
  return (
    <ScreenContainer isScrollable>
      <SectionTitle title="Mandarin Flash" />
      <Text style={styles.body}>
        Flashcards for learning Mandarin in Traditional or Simplified characters. All data stays on
        this device.
      </Text>
      <SectionTitle title="Language data" />
      {packs.map((pack) => (
        <LicenseNotices key={pack.metadata.packId} licenses={pack.metadata.licenses} />
      ))}
      <SectionTitle title="Fonts and code" />
      <LicenseNotices licenses={APP_THIRD_PARTY_NOTICES} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
});
