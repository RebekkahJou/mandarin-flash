/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';

import { parseComponentsFile, writeComponents } from '../lib/componentsFile';

const HEADER = 'component\tvariant\tname\treading\tmeaning';

describe('parseComponentsFile', () => {
  it('reads components with and without a variant', () => {
    expect(
      parseComponentsFile(
        `${HEADER}\n氵\t\t三點水\tsan1 dian3 shui3\twater\n言\t讠\t言字旁\tyan2 zi4 pang2\tspeech\n`,
      ),
    ).toEqual([
      {
        component: '氵',
        variant: '',
        name: '三點水',
        reading: 'san1 dian3 shui3',
        meaning: 'water',
      },
      {
        component: '言',
        variant: '讠',
        name: '言字旁',
        reading: 'yan2 zi4 pang2',
        meaning: 'speech',
      },
    ]);
  });

  it('rejects a reading without tone numbers and a repeated component', () => {
    expect(() => parseComponentsFile(`${HEADER}\n氵\t\t三點水\tsan dian shui\twater`)).toThrow(
      'Line 2',
    );
    const repeated = `${HEADER}\n氵\t\t三點水\tsan1 dian3 shui3\twater\n氵\t\t三點水\tsan1 dian3 shui3\twater`;
    expect(() => parseComponentsFile(repeated)).toThrow('repeats');
  });

  it('accepts one component with two readings, like the two forms of 阝', () => {
    const text = `${HEADER}\n阝\t\t左耳旁\tzuo3 er3 pang2\thill\n阝\t\t右耳旁\tyou4 er3 pang2\tcity`;
    expect(parseComponentsFile(text)).toHaveLength(2);
  });
});

describe('writeComponents', () => {
  it('creates the table in an older pack and replaces earlier rows', () => {
    const database = new Database(':memory:');
    const water = parseComponentsFile(`${HEADER}\n氵\t\t三點水\tsan1 dian3 shui3\twater`);
    writeComponents(database, water);
    writeComponents(database, water);
    expect(database.prepare('SELECT position, component FROM components').all()).toEqual([
      { position: 1, component: '氵' },
    ]);
  });
});
