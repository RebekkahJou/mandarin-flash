import {
  deleteSelectedButtonLabel,
  deleteWordPrompt,
  deleteWordsPrompt,
} from '../wordDeletionText';

describe('word deletion text', () => {
  it('names the word when deleting one', () => {
    expect(deleteWordPrompt('黃疸')).toEqual({
      title: 'Delete 黃疸?',
      message: "It's removed from every list and its practice history is deleted.",
      confirmLabel: 'Delete',
    });
  });

  it('counts the words when deleting a selection', () => {
    expect(deleteWordsPrompt(1).title).toBe('Delete 1 word?');
    expect(deleteWordsPrompt(5)).toEqual({
      title: 'Delete 5 words?',
      message: 'Each one is removed from every list and its practice history is deleted.',
      confirmLabel: 'Delete',
    });
  });

  it('labels the selection button with the count', () => {
    expect(deleteSelectedButtonLabel(1)).toBe('Delete 1 word');
    expect(deleteSelectedButtonLabel(3)).toBe('Delete 3 words');
  });
});
