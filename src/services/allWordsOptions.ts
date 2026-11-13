import type { AppSettings } from '../data/repositories/settingsRepository';
import type { AllWordsViewOptions } from '../domain/allWordsView';
import { formatWordCount } from './wordCount';

/** The settings behind the All words options menu. */
export type AllWordsOptionKey =
  | 'allWordsShowsScriptStudyCards'
  | 'allWordsShowsComponents'
  | 'allWordsShowsRetentionWords'
  | 'allWordsShowsLearningLevel';

export interface AllWordsOptionChoice {
  value: AllWordsOptionKey;
  label: string;
}

export interface AllWordsOptionContext {
  /** e.g. "Zhuyin"; null when the language has no script study cards. */
  scriptStudyName: string | null;
  hasScriptStudyCards: boolean;
  hasComponents: boolean;
}

/** Filters for cards the profile doesn't have are left out. */
export function allWordsOptionChoices(context: AllWordsOptionContext): AllWordsOptionChoice[] {
  const choices: AllWordsOptionChoice[] = [];
  if (context.hasScriptStudyCards && context.scriptStudyName !== null) {
    const label = `Show ${context.scriptStudyName.toLowerCase()} cards`;
    choices.push({ value: 'allWordsShowsScriptStudyCards', label });
  }
  if (context.hasComponents) {
    choices.push({ value: 'allWordsShowsComponents', label: 'Show components' });
  }
  choices.push({ value: 'allWordsShowsRetentionWords', label: 'Show Retention words' });
  choices.push({ value: 'allWordsShowsLearningLevel', label: 'Show learning level' });
  return choices;
}

export function allWordsViewOptions(settings: AppSettings): AllWordsViewOptions {
  return {
    showsScriptStudyCards: settings.allWordsShowsScriptStudyCards,
    showsComponents: settings.allWordsShowsComponents,
    showsRetentionWords: settings.allWordsShowsRetentionWords,
  };
}

export function selectedAllWordsOptions(settings: AppSettings): Set<AllWordsOptionKey> {
  const keys: AllWordsOptionKey[] = [
    'allWordsShowsScriptStudyCards',
    'allWordsShowsComponents',
    'allWordsShowsRetentionWords',
    'allWordsShowsLearningLevel',
  ];
  return new Set(keys.filter((key) => settings[key]));
}

/** "148 words (+60 hidden words)", or just "148 words" when the options hide none. */
export function allWordsCountText(shownCount: number, hiddenCount: number): string {
  const shown = formatWordCount(shownCount);
  if (hiddenCount === 0) return shown;
  const hiddenWords = hiddenCount === 1 ? 'hidden word' : 'hidden words';
  return `${shown} (+${hiddenCount} ${hiddenWords})`;
}
