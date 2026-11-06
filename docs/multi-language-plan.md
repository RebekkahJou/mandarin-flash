# Multi-language and add-ons plan

Status: approved 2026-11-05. **Phase 1 done** (2026-11-05); next step is Phase 2. Update this file as
work lands or decisions change.

Phase 1 notes for later phases:
- The bundled dictionary.db keeps its old column names (traditional, simplified, pinyin);
  `dictionaryLookup` maps them to headword, variant, reading until Phase 3 rebuilds it as a pack.
- CSV export headers are still `character, meaning, pinyin` (from the language bundle); import also
  accepts the generic `word`/`headword` and `reading` headers.
- `PhoneticText`, `ChineseText` and the zhuyin conversion are still Mandarin-only components.
- On-screen text still says "Chinese characters" and "pinyin" in a few places (Add Word, CSV import
  summary); generalize it when a second language arrives.

## Goals

1. Learn languages other than Mandarin, getting only the chosen languages' data.
2. Add more languages later; each language's data arrives only when the user adds it.
3. A welcome screen. With one language: its profiles plus "Add profile". With several: one tab
   per language, the most recently used language selected, that language's profiles below. Only
   the default profile is created automatically; when adding a language the user may copy
   existing profile names to it.
4. Mandarin can be learned as Traditional or as Simplified.
5. Optional add-ons: photo text recognition (OCR) to add words from a photo, and self-challenges
   / between-profile games on shared vocabulary.
6. Optional starter vocabulary per language: 10 sets of 50 common words (500 total), sorted into
   word-type lists automatically, the next set unlocking at 90% learned.
7. More default word-type lists where they help.
8. Getting a language should be a smooth, low-effort flow for the user.
9. Splitting multi-character words: offer to add each character of a compound separately.
10. Mandarin extras: a built-in Components list and optional zhuyin study cards.

## Target languages

| Language | Script | Reading shown | Notes |
|---|---|---|---|
| Mandarin (Traditional, Simplified) | Han | pinyin / zhuyin | **Built in.** One pack serves both; Simplified needs SC fonts and a Simplified search index |
| Japanese | kanji, hiragana, katakana | kana reading (furigana), optional romaji | JMdict (CC BY-SA) has readings and word types. Same Han code points render in Chinese shapes unless a Japanese font is used, so the pack carries a Japanese font subset. Normalize half-width/full-width kana |
| Korean | Hangul (optional Hanja) | optional romanization | System fonts suffice. Normalize Hangul to composed form |
| German | Latin | none | Nouns carry gender (der/die/das) |
| Finnish | Latin | none | Long inflected words; lookup needs base-form handling |
| Irish (Gaeilge) | Latin with fada | none | Initial mutations (bhean → bean, t-uisce → uisce) must be undone for lookup. Open data is thin |
| Scottish Gaelic (Gàidhlig) | Latin with grave accents | none | Same mutation handling. Open data thinnest of all; starter list likely hand-built |
| Ukrainian (Cyrillic) | Cyrillic | word with stress mark | Comes before Russian. Good open data (Wiktionary, FrequencyWords, Tatoeba). Search ignores stress marks; distinct letters і ї є ґ |
| Russian (Cyrillic) | Cyrillic | word with stress mark | Rich open data (Wiktionary, OpenRussian, Tatoeba). Search ignores stress marks and treats ё as е. Shares most code with Ukrainian |
| Arabic | Arabic | optional transliteration | Right-to-left per text element (English UI stays left-to-right); search ignores vowel marks; Arabic fonts |

## Decisions made

- **Base (native) language is English only.** Meanings and app text stay in English.
- **The welcome screen opens on the most recently used language.**
- **Platforms:** Android on Google Play first, iOS and other stores later. Nothing may depend on
  one store without a fallback.
- **Mandarin stays built in**, so the app works at first launch. Other languages are added later.
- **Packs are signed.** A private key kept off the device signs each pack; the app verifies with
  the built-in public key and rejects unsigned or altered packs. Needs one small audited
  pure-JavaScript signature library (e.g. `@noble/curves`, no network use), justified when added.
- **Starter words come from open frequency lists** (e.g. FrequencyWords, CC BY-SA 4.0), curated by
  hand. The resulting packs are CC BY-SA; record them in docs/THIRD_PARTY.md and on the About
  screen.
- **Starter set unlock:** set n+1 can be added once at least 90% of set n's words still in the
  profile have moved down to **Reinforcement or lower** (at least one "Learned").
- **OCR on Android uses Google's ML Kit, unbundled:** about 260 KB in the app; the recognition
  model is downloaded by Google Play services when the user turns OCR on. Play devices only.
  **ML Kit can't read Arabic or Cyrillic**, so the add-on's download screen says so. iOS uses
  Apple's built-in Vision text recognition. Verify ML Kit works with no INTERNET permission.
- **Pack delivery: store-hosted packs where available, smoother file import everywhere else**
  (routes A + B below).
- **Language order:** German, Japanese, Korean, Scottish Gaelic, Irish, Ukrainian, Russian,
  Finnish, Arabic. Scottish Gaelic moved up because a beta tester can test it.
- **Adjectives and Adverbs are default lists in every language.** Words like "favorite", "good",
  "bad", "hot" and "tired" are needed early in common speech.
- **Size targets:** base app a standard size; medium sizes (roughly 50–100 MB) with several
  packs; up to roughly 150–250 MB with 5+ packs. Each pack about 25 MB or less.

## Getting a language pack (decided: A + B)

No server to run. Packs are always signed, and the same pack file works for every
route, so routes can be combined and changed later.

| Route | User steps | Who hosts | App network access | Stores |
|---|---|---|---|---|
| **A. Store-hosted packs** (Play Asset Delivery on Android; Apple-hosted asset packs on iOS) | Tap "Add Japanese", wait, done | Google / Apple, as part of the app listing | None by the app; the store app downloads. Verify for both platforms | Play and App Store only |
| **B. Smoother file import** | Tap "Add Japanese" → browser opens the pack page → tap Download → tap **Open** on the download → imported | Static files, e.g. GitHub Releases (no server to run) | None; opening the browser isn't a network call by the app | All |
| C. Plain file import | Download in browser, then find the file through the app's file picker | Static files | None | All |
| D. In-app download from a static host | Tap "Add Japanese", wait, done | Static files, e.g. GitHub Releases | **Yes**, so it changes the "Privacy first" rule; reveals IP address and chosen language | All |

B works by registering the app to open `.mfpack` files (an Android intent filter and iOS document
type, set through app config). Tapping **Open** on the finished download hands the file straight
to the app, which verifies and installs it.

Decision: **A where available, B everywhere else** (other Android stores, sideloading, and
development builds). That gives a one-tap flow for nearly all users, keeps the app itself
network-free, and needs no server. A still needs: a native module or config plugin per platform,
store-side testing (Play internal test track; TestFlight), and a CLAUDE.md wording change to allow
store-managed downloads.

## Constraint: add-on *code* can't be downloaded or imported

Google Play forbids downloading executable code from anywhere but Play; Apple's guideline 2.5.2
forbids downloaded code that changes an app's features; CLAUDE.md forbids evaluating imported
files. So an add-on is **code that ships inside the app, switched off until the user turns it
on** in an Add-ons screen, plus optional data when it needs large data. Game and challenge code is
small (well under 1 MB).

## Pack format

One file per pack (e.g. `japanese.mfpack`), which is a SQLite database. No new dependency is
needed to read it.

| Table | Contents |
|---|---|
| `pack_metadata` | pack type, language id, version, schema version, size, licenses and sources, word types the pack tags reliably |
| `entries`, `sentences` | dictionary in a language-neutral layout: `headword`, `variant`, `reading`, glosses with word-type flags, `rank`, search key |
| `starter_words` | set number (1–10), position, headword, reading, curated word type |
| `pack_files` | fonts and other files as blobs; written to app storage on install, then loaded from there |

The signature covers the whole file. Import checks (packs are untrusted): signature, size limit,
required tables and columns, schema version, row counts, text length limits, all read through
parameterized SQL. Packs stay read-only and separate from the encrypted user database.

## Word-type lists

Today's tagging is a heuristic on CC-CEDICT's English glosses, so only noun / verb / adjective are
reliable. Starter words have hand-curated word types, so their lists are always accurate.
Mismatch warnings only use word types a pack lists as reliable. JMdict (Japanese) and Wiktionary
data (kaikki.org) tag word types properly.

Default lists created for each profile:

| Language | Default lists |
|---|---|
| All | General Vocabulary, Focus Vocabulary, Nouns, Verbs, Adjectives, Adverbs, Phrases |
| Mandarin | + Measure words (量詞), Components |
| Japanese | + Particles (助詞), Counters |
| Korean | + Particles (조사) |
| German | + Prepositions |
| Russian | + Prepositions |
| Irish, Scottish Gaelic | + Prepositions (they combine with pronouns: agam, agat…) |
| Arabic | + Prepositions & particles |
| Finnish | (none extra) |

Suggested lists (offered in the "+" dialog): Pronouns, Prepositions (Mandarin coverbs such as
在 從 給), Conjunctions, Numbers, Question words, Particles, Time words. A starter word whose list
doesn't exist yet creates that list.

Extend `PartOfSpeech` and the dictionary's word-type flags (adverb, pronoun, preposition,
conjunction, measure word / counter, particle, numeral, question word); bump the pack schema.

## Starter vocabulary

- Lives inside each language pack (about 10–50 KB), so no separate download.
- Curation guideline: every set mixes word types (nouns, verbs, adjectives, adverbs, question
  words and everyday phrases) in rough proportion to how often they're needed, so describing
  words like "good", "hot" and "tired" arrive in the first sets rather than after hundreds of
  nouns.
- Offered during language setup (optional), then from an "Add next 50 starter words" button on the
  Word lists tab once unlocked, with progress such as "Starter set 2: 38 of 50 learned".
- Each word goes into General Vocabulary and the list for its curated word type. Words the user
  already has aren't duplicated but count toward the set. `words.starter_set` records the set.
- **Languages without usable frequency data** (likely Scottish Gaelic and Irish): build the sets
  from the most-used **English** words instead. Users learn from English and will first reach for
  the words and ideas they already use most.
  - Source: an open English frequency list (e.g. FrequencyWords English, CC BY-SA 4.0), keeping
    content words and everyday phrases.
  - Each English word is matched to a target-language entry through a reverse (English meaning →
    word) index built by the pack script. Matching is ambiguous ("get", "set"), so every match is
    reviewed by hand; the Scottish Gaelic beta tester can check that pack.
  - The same curation guideline applies: each set mixes word types.

## Splitting multi-character words

When the user adds a noun made of several distinct characters, such as 雜貨店 (zá huò diàn,
grocery store), the app asks whether to also add the individual characters for separate study:

- A checkbox per distinct character (雜 zá, 貨 huò, 店 diàn), each with its dictionary meaning.
  Repeated characters appear once (媽媽 offers only 媽); characters the user already has are shown
  as already added.
- Chosen characters go to General Vocabulary (assumption), get their own dictionary meanings, and
  are linked to the compound in a small `word_parts` table so a card can later show its breakdown.
- **Bulk adds** (CSV import, starter sets) ask once in the summary ("Also add 34 individual
  characters?") instead of once per word.
- Applies to languages whose characters carry meaning on their own: Mandarin, and Japanese kanji
  (雑貨店 splits the same way). Not kana, Hangul syllables or alphabetic languages. A flag in the
  language definition turns it on.
- Starts with nouns, as requested; it could later be offered for verbs and adjectives too (喜歡,
  漂亮).

## Mandarin extras

**Components list.** A default list for Mandarin profiles holding common character components
(radicals), such as 氵 (water), 亻 (person), 口 (mouth), 木 (tree) and 艹 (grass).

- Pre-filled with about 50 of the most common components (assumption), each with its meaning and
  usual name, e.g. 氵 "sān diǎn shuǐ".
- Data: radical assignments from Unicode's Unihan database (Unicode license, permissive) plus a
  hand-curated list of names and meanings, shipped in the Mandarin pack. Avoid CHISE-derived
  decomposition data, which is GPL.
- A special list kind: no word-type checks, and a component may have no pinyin of its own.
- Japanese kanji share most components, so the same data can serve a Japanese Components list
  later.

**Zhuyin study cards.** When phonetic display is set to Pinyin or to Pinyin + Zhuyin, Settings
offers "Learn zhuyin". Turning it on adds a Zhuyin list of the 37 symbols (ㄅ ㄆ ㄇ ㄈ …) plus the tone
marks. Each card shows a symbol; revealing it shows the pinyin it stands for and an example
character (ㄅ: b, as in 八 bā). The option is hidden when the display is Zhuyin only, since that
user already reads zhuyin. Turning it off hides the list but keeps its progress. The symbol table
is small, so it lives in code, not in the pack.

**Generalizing (recommended):** the same mechanism gives every language optional "script study"
cards: hiragana and katakana for Japanese, Hangul letters for Korean, the Cyrillic alphabet for
Ukrainian and Russian, and Arabic letters. Zhuyin becomes the first of these, defined in the
language definition.

## Progress data (start early)

Add a `review_events` table (profile, word, answer, time) in Phase 1, since history can't be
reconstructed later. About 2 MB a year at 100 reviews a day, in the encrypted database. Profiles of
the same language compare on shared words via (language, headword, reading).

## Add-ons

| Add-on | In app | Extra download | Notes |
|---|---|---|---|
| Self-challenges and between-profile games | small, off by default | none | local only; uses `review_events` and starter sets |
| Photo text recognition (OCR) | ML Kit unbundled (Android), Vision (iOS), off by default | Play services fetches the model | No Arabic or Cyrillic on Android; use the system photo picker and camera app so no camera permission is needed (verify) |

## Phases

Each phase ships on its own with tests and `npm run check` passing.

1. **Language-neutral core (no visible change).** `LanguageId` and language definitions
   (including the character-splitting flag and script study sets);
   `LanguageAdapter` interface with Chinese first; generic word fields via a column-renaming
   migration; `profiles.language_id`; `review_events`; extended `PartOfSpeech`; CSV import keeps
   old headers.
2. **Profiles and welcome screen, Mandarin only.** First-run flow, language tabs, app-level session,
   copy profile names, Mandarin Traditional and Simplified as two languages.
3. **Pack format, signing and install.** Mandarin rebuilt as a (built-in) pack; route B
   (open-with import); signature check; font extraction; licenses on the About screen; default and
   suggested lists per language.
4. **Starter vocabulary and Mandarin extras.** Curated Mandarin sets, set-by-set adding, unlock
   rule, progress display; splitting compounds into characters (`word_parts`); the Components
   list; zhuyin study cards.
5. **Store-hosted packs (route A):** Play Asset Delivery, then Apple-hosted packs with the iOS
   port.
6. **Add-ons framework and games.**
7. **OCR add-on.**
8. **New languages,** in this order: German (simplest, proves the pipeline), Japanese (best open
   data; reuses the Chinese groundwork), Korean, Scottish Gaelic (beta tester available), Irish
   (shares the mutation handling), Ukrainian, Russian (shares the Cyrillic work), Finnish,
   Arabic.

## Open questions

None at the moment. Items marked "verify" above are checks to do during the relevant phase.
