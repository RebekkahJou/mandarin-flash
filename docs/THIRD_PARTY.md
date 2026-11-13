# Third-party data, fonts and code bundled in the app

Keep this list in sync with the About screen (`src/app/about.tsx`). Data in a language pack is
credited in the pack's own metadata (`licenses`), which the About screen lists; for the built-in
Mandarin pack that is `scripts/lib/mandarinPack.ts`.

| Item | Used for | License | Source |
|---|---|---|---|
| CC-CEDICT | Dictionary meanings and pinyin (`assets/data/mandarin-pack.db`) | CC BY-SA 4.0 | https://www.mdbg.net/chinese/dictionary?page=cc-cedict |
| Wiktionary (via kaikki.org) | Taiwan pronunciations (`scripts/data/mandarin-taiwan-readings.tsv`, applied in `assets/data/mandarin-pack.db`) | CC BY-SA 4.0 | https://en.wiktionary.org, extracted by https://kaikki.org/dictionary/Chinese/ |
| Tatoeba sentences | Example sentences (`assets/data/mandarin-pack.db`) | CC BY 2.0 FR | https://tatoeba.org/downloads |
| Noto Serif TC | Flashcard font, subset (`assets/fonts/NotoSerifTC-subset.otf`) | SIL OFL 1.1 | https://github.com/notofonts/noto-cjk |
| LXGW WenKai TC | Flashcard font, subset (`assets/fonts/LXGWWenKaiTC-subset.ttf`) | SIL OFL 1.1 | https://github.com/lxgw/LxgwWenkaiTC |
| jf open-huninn | Flashcard font, subset (`assets/fonts/OpenHuninn-subset.ttf`) | SIL OFL 1.1 | https://github.com/justfont/open-huninn-font |
| opencc-js | Conversion between Simplified and Traditional characters | MIT + Apache 2.0 (dictionaries) | https://github.com/nk2028/opencc-js |
| @noble/ed25519 | Verifying language pack signatures (pure JavaScript, no network use) | MIT | https://github.com/paulmillr/noble-ed25519 |

The Mandarin pack is a derived work of CC-CEDICT and Wiktionary, so it is shared under CC BY-SA
4.0.
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

npm run build:mandarin-pack -- <source folder>
# Taiwan readings: only when refreshing them (1.2 GB download; the result is committed)
curl -L -o chinese.jsonl https://kaikki.org/dictionary/Chinese/kaikki.org-dictionary-Chinese.jsonl
npm run extract:taiwan-readings -- chinese.jsonl
npm run update:mandarin-curated-data
npm run build:font-characters
pip install fonttools
python scripts/subset-fonts.py <source folder>/fonts
```

If the Mandarin data changes, bump `MANDARIN_PACK_VERSION` in `scripts/lib/mandarinPack.ts` and
`BUILT_IN_PACK_COPY_VERSION` in `src/data/openDatabases.ts` so phones replace their copy.
