import { packTableColumnsFor } from '../packSchema';

describe('packTableColumnsFor', () => {
  it('adds tables from the schema version that introduced them', () => {
    expect(packTableColumnsFor(2).word_sets).toBeUndefined();
    expect(packTableColumnsFor(3).word_sets).toEqual(['set_id', 'topic', 'title', 'position']);
  });

  it('adds columns to existing tables from the schema version that introduced them', () => {
    expect(packTableColumnsFor(4).word_sets).toEqual([
      'set_id',
      'topic',
      'title',
      'position',
      'entries_from',
    ]);
  });
});
