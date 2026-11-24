import { useEffect, useMemo, useState } from 'react';

import type { RadicalPosition } from '../../domain/wordSort';
import { WordSort, availableSubSorts, availableWordSorts } from '../../domain/wordSort';
import type { RadicalLookup, SortableWord, WordSortPlace } from '../../services/wordSorting';
import {
  WORD_SORT_LABELS,
  WORD_SORT_SETTING_KEYS,
  resolvedWordSorts,
  sortWords,
  wordSortContext,
} from '../../services/wordSorting';
import { useAppServices, useSettings } from '../AppServicesContext';

function sortChoices(sorts: readonly WordSort[]) {
  return sorts.map((sort) => ({ value: sort, label: WORD_SORT_LABELS[sort] }));
}

/**
 * Rows in the place's saved sort order (rows come in newest first), and the choices for changing
 * it. Radical data is read from the pack only once a radical sort is chosen.
 */
export function useWordSorting<Row extends SortableWord>(
  rows: readonly Row[],
  place: WordSortPlace,
) {
  const { languageBundle, dictionaryLookup } = useAppServices();
  const { settings, updateSetting } = useSettings();
  const [radicalPositions, setRadicalPositions] = useState<ReadonlyMap<
    string,
    RadicalPosition
  > | null>(null);
  const context = wordSortContext(languageBundle.definition, settings);
  const { sort, subSort } = resolvedWordSorts(context, settings, place);
  const isRadicalSortChosen = sort === WordSort.Radical || subSort === WordSort.Radical;

  useEffect(() => {
    if (!isRadicalSortChosen) return;
    void dictionaryLookup.radicalPositions().then(setRadicalPositions);
  }, [isRadicalSortChosen, dictionaryLookup]);

  const sortedRows = useMemo(() => {
    const sortContext = wordSortContext(languageBundle.definition, settings);
    const radicalOf: RadicalLookup = (character) => radicalPositions?.get(character);
    return sortWords(rows, resolvedWordSorts(sortContext, settings, place), radicalOf);
  }, [rows, languageBundle, settings, place, radicalPositions]);

  const keys = WORD_SORT_SETTING_KEYS[place];
  return {
    sortedRows,
    choices: {
      sortChoices: sortChoices(availableWordSorts(context)),
      selectedSort: sort,
      chooseSort: (choice: WordSort) => updateSetting(keys.sort, choice),
      subSortChoices: sortChoices(availableSubSorts(context)),
      selectedSubSort: subSort,
      chooseSubSort: (choice: WordSort) => updateSetting(keys.subSort, choice),
    },
  };
}

export type WordSortChoices = ReturnType<typeof useWordSorting>['choices'];
