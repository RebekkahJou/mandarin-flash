# Third-party data, fonts and code bundled in the app

Keep this list in sync with the About screen (`src/app/about.tsx`).

| Item | Used for | License | Source |
|---|---|---|---|
| CC-CEDICT | Dictionary meanings and pinyin (`assets/data/dictionary.db`) | CC BY-SA 4.0 | https://www.mdbg.net/chinese/dictionary?page=cc-cedict |
| Tatoeba sentences | Example sentences (`assets/data/dictionary.db`) | CC BY 2.0 FR | https://tatoeba.org/downloads |
| Noto Serif TC | Flashcard font, subset (`assets/fonts/NotoSerifTC-subset.otf`) | SIL OFL 1.1 | https://github.com/notofonts/noto-cjk |
| LXGW WenKai TC | Flashcard font, subset (`assets/fonts/LXGWWenKaiTC-subset.ttf`) | SIL OFL 1.1 | https://github.com/lxgw/LxgwWenkaiTC |
| jf open-huninn | Flashcard font, subset (`assets/fonts/OpenHuninn-subset.ttf`) | SIL OFL 1.1 | https://github.com/justfont/open-huninn-font |
| opencc-js | Simplified → Taiwan Traditional conversion | MIT + Apache 2.0 (dictionaries) | https://github.com/nk2028/opencc-js |

The dictionary database is a derived work of CC-CEDICT, so it is shared under CC BY-SA 4.0.
OFL fonts may be subset and bundled. The subsets keep their original font names here because
the OFL's Reserved Font Name rules don't apply to the families above. Re-check this if you add
another font.

## Rebuilding the bundled data

Download the sources into a folder outside the repo, then run the scripts:

```sh
# CC-CEDICT
curl -L -o cedict.txt.gz https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz
gunzip cedict.txt.gz
# Tatoeba (Mandarin sentences, English sentences, Mandarin→English links)
curl -LO https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences.tsv.bz2
curl -LO https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2
curl -LO https://downloads.tatoeba.org/exports/per_language/cmn/cmn-eng_links.tsv.bz2
bunzip2 *.bz2
# Fonts, put in a fonts/ subfolder: NotoSerifTC-Regular.otf, LXGWWenKaiTC-Regular.ttf, jf-openhuninn.ttf

npm run build:dictionary -- <source folder>
npm run build:font-characters
pip install fonttools
python scripts/subset-fonts.py <source folder>/fonts
```

If the dictionary changes, bump `DICTIONARY_VERSION` in `src/data/openDatabases.ts` so phones
replace their copy.
