import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GameKind } from '../../domain/gamePlayers';
import { MEANING_MATCH_ROUND_COUNTS } from '../../domain/meaningMatch';
import {
  SPEED_RACE_ROUND_COUNTS,
  SPEED_RACE_WORD_COUNTS,
  SpeedRaceCardFront,
} from '../../domain/speedRace';
import {
  GAME_NAMES,
  NO_OTHER_PROFILE_TEXT,
  SPEED_RACE_CARD_FRONT_LABELS,
} from '../../services/gameText';
import { ChoiceChips } from '../../ui/components/ChoiceChips';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SectionTitle } from '../../ui/components/SectionTitle';
import { useGamesSetup } from '../../ui/hooks/useGamesSetup';
import { useGamesTabText } from '../../ui/hooks/useGamesTabText';
import { colors, fontSizes, spacing } from '../../ui/theme';

const GAME_CHOICES = Object.values(GameKind).map((game) => ({
  value: game,
  label: GAME_NAMES[game],
}));
const WORD_COUNT_CHOICES = SPEED_RACE_WORD_COUNTS.map((count) => ({
  value: count,
  label: `${count}`,
}));
const SPEED_RACE_ROUND_CHOICES = SPEED_RACE_ROUND_COUNTS.map((count) => ({
  value: count,
  label: `${count}`,
}));
const CARD_FRONT_CHOICES = Object.values(SpeedRaceCardFront).map((front) => ({
  value: front,
  label: SPEED_RACE_CARD_FRONT_LABELS[front],
}));
const MEANING_MATCH_ROUND_CHOICES = MEANING_MATCH_ROUND_COUNTS.map((count) => ({
  value: count,
  label: `${count}`,
}));

export default function GamesScreen() {
  const setup = useGamesSetup();
  const text = useGamesTabText(setup);

  if (!setup.opponent) {
    return (
      <ScreenContainer isScrollable>
        <Text style={styles.body}>{NO_OTHER_PROFILE_TEXT}</Text>
        <View style={styles.buttonRow}>
          <PrimaryButton label="Add a new user" onPress={() => router.push('/profiles/add')} />
        </View>
      </ScreenContainer>
    );
  }

  const isSpeedRace = setup.game === GameKind.SpeedRace;
  const speedRaceOptions = isSpeedRace ? (
    <>
      <SectionTitle title="Words per set" />
      <ChoiceChips
        choices={WORD_COUNT_CHOICES}
        selectedValue={setup.speedRaceOptions.wordCount}
        onSelect={(wordCount) => setup.updateSpeedRaceOptions({ wordCount })}
      />
      <SectionTitle title="Rounds" />
      <ChoiceChips
        choices={SPEED_RACE_ROUND_CHOICES}
        selectedValue={setup.speedRaceOptions.roundCount}
        onSelect={(roundCount) => setup.updateSpeedRaceOptions({ roundCount })}
      />
      <SectionTitle title="Show first" />
      <ChoiceChips
        choices={CARD_FRONT_CHOICES}
        selectedValue={setup.speedRaceOptions.cardFront}
        onSelect={(cardFront) => setup.updateSpeedRaceOptions({ cardFront })}
      />
    </>
  ) : null;
  const meaningMatchOptions = isSpeedRace ? null : (
    <>
      <SectionTitle title="Rounds" />
      <ChoiceChips
        choices={MEANING_MATCH_ROUND_CHOICES}
        selectedValue={setup.meaningMatchRounds}
        onSelect={setup.chooseMeaningMatchRounds}
      />
    </>
  );
  const notEnoughWords = text.notEnoughWords ? (
    <Text style={styles.warning}>{text.notEnoughWords}</Text>
  ) : null;

  return (
    <ScreenContainer isScrollable>
      <SectionTitle title="Play with" />
      <ChoiceChips
        choices={text.opponentChoices}
        selectedValue={setup.opponent.id}
        onSelect={setup.chooseOpponent}
      />
      <Text style={styles.hint}>{text.sharedWords}</Text>

      <SectionTitle title="Challenge" />
      <ChoiceChips choices={GAME_CHOICES} selectedValue={setup.game} onSelect={setup.chooseGame} />
      <Text style={styles.hint}>{text.gameDescription}</Text>
      {speedRaceOptions}
      {meaningMatchOptions}

      {notEnoughWords}
      <View style={styles.buttonRow}>
        <PrimaryButton label={text.startLabel} onPress={setup.start} isDisabled={!text.canStart} />
      </View>

      <SectionTitle title="Recent challenges" />
      {text.recentLines.map((line) => (
        <Text key={line.key} style={styles.body}>
          {line.text}
        </Text>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  warning: {
    fontSize: fontSizes.body,
    color: colors.warning,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.small,
  },
});
