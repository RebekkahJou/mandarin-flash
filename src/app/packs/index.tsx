import { StyleSheet, Text, View } from 'react-native';

import { LanguagePackRow } from '../../ui/components/LanguagePackRow';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SectionTitle } from '../../ui/components/SectionTitle';
import type { LanguagePackRowData } from '../../ui/hooks/useLanguagePackList';
import { useLanguagePackList } from '../../ui/hooks/useLanguagePackList';
import type { StorePackRowData } from '../../ui/hooks/useStorePacks';
import { useStorePacks } from '../../ui/hooks/useStorePacks';
import { colors, fontSizes, spacing } from '../../ui/theme';

const HINT =
  "A language pack holds a language's dictionary and example sentences. To add one, tap Open on a downloaded .mfpack file and choose Mandarin Flash, or pick the file here. Packs are checked before they are installed, and the app never goes online to get them.";
const HINT_WITH_STORE_PACKS =
  "A language pack holds a language's dictionary and example sentences. Get one from Google Play below, tap Open on a downloaded .mfpack file and choose Mandarin Flash, or pick the file here. Packs are checked before they are installed, and the app itself never goes online.";

export default function LanguagePacksScreen() {
  const { rows, isInstalling, chooseAndInstall, remove } = useLanguagePackList();
  const { rows: storeRows, getPack } = useStorePacks();
  const hasStorePacks = storeRows.length > 0;
  const hint = hasStorePacks ? HINT_WITH_STORE_PACKS : HINT;
  const installLabel = isInstalling ? 'Installing…' : 'Install a pack file';

  const renderRow = (row: LanguagePackRowData) => {
    const removeAction = {
      label: 'Remove',
      onPress: () => void remove(row.pack),
      isOutlined: true,
    };
    const action = row.canRemove ? removeAction : null;
    return (
      <LanguagePackRow key={row.key} title={row.title} details={row.details} action={action} />
    );
  };

  const renderStoreRow = (row: StorePackRowData) => {
    const getAction = row.actionLabel
      ? { label: row.actionLabel, onPress: () => void getPack(row.storePack), isOutlined: false }
      : null;
    return (
      <LanguagePackRow key={row.key} title={row.title} details={row.details} action={getAction} />
    );
  };

  const storeSection = hasStorePacks ? (
    <>
      <SectionTitle title="Available from Google Play" />
      <View style={styles.rows}>{storeRows.map(renderStoreRow)}</View>
    </>
  ) : null;

  return (
    <ScreenContainer isScrollable>
      <Text style={styles.hint}>{hint}</Text>
      <View style={styles.buttonRow}>
        <PrimaryButton label={installLabel} onPress={() => void chooseAndInstall()} />
      </View>
      {storeSection}
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
