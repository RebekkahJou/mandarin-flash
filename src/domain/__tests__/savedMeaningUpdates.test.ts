import { planMeaningUpdates } from '../savedMeaningUpdates';

const shout = (meaning: string) => meaning.replace('[x]', 'X');

describe('planMeaningUpdates', () => {
  it('returns only the saved meanings that change, with every meaning formatted', () => {
    const saved = [
      { id: 1, meanings: ['coin', 'tael [x]'] },
      { id: 2, meanings: ['money'] },
    ];
    expect(planMeaningUpdates(saved, shout)).toEqual([{ id: 1, meanings: ['coin', 'tael X'] }]);
  });

  it('plans nothing when every meaning already reads well', () => {
    expect(planMeaningUpdates([{ id: 1, meanings: ['money'] }], shout)).toEqual([]);
  });
});
