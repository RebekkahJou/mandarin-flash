import { GeneralWordList } from '../../domain/generalWordList';
import { PartOfSpeech } from '../../domain/partOfSpeech';
import { PartOfSpeechWordList } from '../../domain/partOfSpeechWordList';
import { AdditionWarningKind, planWordAddition } from '../wordAdditionPlanner';

const generalList = new GeneralWordList({ id: 1, profileId: 1, name: 'General Vocabulary' });
const verbList = new PartOfSpeechWordList({
  id: 2,
  profileId: 1,
  name: 'Verbs',
  partOfSpeech: PartOfSpeech.Verb,
});
const nounList = new PartOfSpeechWordList({
  id: 3,
  profileId: 1,
  name: 'Nouns',
  partOfSpeech: PartOfSpeech.Noun,
});

const candidates = [
  { text: 'row; line', partsOfSpeech: [PartOfSpeech.Noun] },
  { text: 'to walk', partsOfSpeech: [PartOfSpeech.Verb] },
  { text: 'capable', partsOfSpeech: [PartOfSpeech.Adjective] },
];

const baseRequest = {
  headword: '行',
  formMeanings: ['row; line', 'to walk', 'capable'],
  hasUserEditedMeanings: false,
  definitionCandidates: candidates,
  wordPartsOfSpeech: [PartOfSpeech.Noun, PartOfSpeech.Verb, PartOfSpeech.Adjective],
  reliablePartsOfSpeech: [PartOfSpeech.Noun, PartOfSpeech.Verb, PartOfSpeech.Adjective],
  listIdsAlreadyContainingWord: new Set<number>(),
};

describe('planWordAddition', () => {
  it('gives part-of-speech lists their own suggested meanings', () => {
    const plan = planWordAddition({ ...baseRequest, selectedLists: [generalList, verbList] });
    expect(plan[0].definitionsOverride).toBeUndefined();
    expect(plan[1].definitionsOverride).toEqual(['to walk']);
  });

  it('applies meanings the user edited to every list', () => {
    const plan = planWordAddition({
      ...baseRequest,
      formMeanings: ['to go'],
      hasUserEditedMeanings: true,
      selectedLists: [generalList, verbList],
    });
    expect(plan.every((addition) => addition.definitionsOverride === undefined)).toBe(true);
  });

  it('warns once per list that already contains the word', () => {
    const plan = planWordAddition({
      ...baseRequest,
      selectedLists: [generalList, verbList],
      listIdsAlreadyContainingWord: new Set([1]),
    });
    expect(plan[0].warnings.map((warning) => warning.kind)).toEqual([
      AdditionWarningKind.AlreadyInList,
    ]);
    expect(plan[1].warnings).toEqual([]);
  });

  it('warns when the word has no meaning of the list part of speech', () => {
    const plan = planWordAddition({
      ...baseRequest,
      wordPartsOfSpeech: [PartOfSpeech.Verb],
      selectedLists: [nounList],
    });
    expect(plan[0].warnings[0].kind).toBe(AdditionWarningKind.PartOfSpeechMismatch);
  });

  it('does not warn about word types the language tags loosely', () => {
    const plan = planWordAddition({
      ...baseRequest,
      wordPartsOfSpeech: [PartOfSpeech.Verb],
      reliablePartsOfSpeech: [PartOfSpeech.Verb],
      selectedLists: [nounList],
    });
    expect(plan[0].warnings).toEqual([]);
  });
});
