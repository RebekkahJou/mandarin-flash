import type { WordList } from '../../domain/wordList';
import { Checkboxes } from './Checkboxes';

interface ListCheckboxesProps {
  lists: readonly WordList[];
  selectedListIds: ReadonlySet<number>;
  onToggle: (wordList: WordList) => void;
}

/** One checkbox per word list, for choosing which lists a word belongs to. */
export function ListCheckboxes({ lists, selectedListIds, onToggle }: ListCheckboxesProps) {
  const options = lists.map((list) => ({ value: list.id, label: list.name }));
  const toggleList = (listId: number) => {
    const list = lists.find((candidate) => candidate.id === listId);
    if (list) onToggle(list);
  };
  return <Checkboxes options={options} selectedValues={selectedListIds} onToggle={toggleList} />;
}
