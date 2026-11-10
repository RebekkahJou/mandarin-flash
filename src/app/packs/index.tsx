import { StyleSheet, Text, View } from 'react-native';

import { LanguagePackRow } from '../../ui/components/LanguagePackRow';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SectionTitle } from '../../ui/components/SectionTitle';
import type { LanguagePackRowData } from '../../ui/hooks/useLanguagePackList';
import { useLanguagePackList } from '../../ui/hooks/useLanguagePackList';
import { colors, fontSizes, spacing } from '../../ui/theme';

export default function LanguagePacksScreen() {
  const { rows, isInstalling, chooseAndInstall, remove } = useLanguagePackList();
  const installLabel = isInstalling ? 'Installing…' : 'Install a pack file';

  const renderRow = (row: LanguagePackRowData) => {
    const onRemove = row.canRemove ? () => void remove(row.pack) : undefined;
    return (
      <LanguagePackRow key={row.key} title={row.title} details={row.details} onRemove={onRemove} />
    );
  };

  return (
    <ScreenContainer isScrollable>
      <Text style={styles.hint}>
        A language pack holds a language&apos;s dictionary and example sentences. To add one, tap
        Open on a downloaded .mfpack file and choose Mandarin Flash, or pick the file here. Packs
        are checked before they are installed, and the app never goes online to get them.
      </Text>
      <View style={styles.buttonRow}>
        <PrimaryButton label={installLabel} onPress={() => void chooseAndInstall()} />
      </View>
      <SectionTitle title="Installed" />
      <View style={styles.rows}>{rows.map(renderRow)}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  rows: {
    gap: spacing.small,
  },
});
