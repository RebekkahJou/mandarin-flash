# Multi-language and add-ons plan

Status: approved 2026-11-05. **Phase 1 done** (2026-11-05). **Phase 2 done** (2026-11-06,
tested on the phone; merged into main). **Phase 3 done** (2026-11-10, branch
lang-compatibility-p3, phone-tested, merged into main; see "Phase 3 wrap-up" below). **Phase 4
built and phone-tested** (2026-11-10, branch lang-compatibility-p4; see "Phase 4 decisions"
below). **Next: Phase 4b, health-related word sets** (planned 2026-11-10; see "Health-related
word sets" below). Update this file as work lands or decisions change.

Phase 4 decisions (2026-11-10):
- **Starter vocabulary:** 500 words in 10 sets of 50, hand-picked (the pack has no frequency
  data; entry rank only orders readings) in scripts/data/mandarin-starter-words.tsv, each with a
  curated word type (a part of speech, "phrase" or "time word"). Every set mixes word types.
  Words used in only one region (腳踏車, 計程車) were avoided so both Mandarin languages share them.
  Every word must match a pack entry by headword and reading.
- **The built-in Mandarin pack is version 2, schema 2** (starter words and components; the
  dictionary is unchanged). `npm run update:mandarin-curated-data` writes both curated files
  into it; `npm run build:mandarin-pack` includes them too. Test packs must now be version 3+.
- **Starter sets are offered on the Lists tab** ("Starter vocabulary" card) rather than during
  profile setup, because a new profile isn't active yet when it is created. The next set unlocks
  when 90% of the latest set is at Memory reinforcement or Retention. Words already in the
  profile count toward the set (`words.starter_set`) and aren't added again. Each new word goes
  into General Vocabulary and the list for its word type (created if missing), with that
  list's suggested meanings.
- **Splitting compounds:** offered for multi-character nouns (by dictionary word type, or the
  curated type for starter words). Add Word shows checkboxes; CSV import and starter sets ask
  once. Chosen characters get their first dictionary meanings in General Vocabulary. Every
  character the profile has is linked in `word_parts` (compound, position, part). Component
  cards don't count as already having a character.
- **Components:** 59 curated components in scripts/data/mandarin-components.tsv, shipped in the
  pack's new `components` table (pack schema 2; schema 1 packs stay valid and have none). Names
  are stored in Traditional and converted for Simplified; components with a Simplified form
  (言/讠, 門/门) carry it as a variant. Each component is a word in a Components list (a new list
  kind, no word-type checks): reading = the name's pinyin, meanings = [meaning, name]. The list
  is a Mandarin default, filled once from the pack (`word_lists.filled_at`) the first time lists
  load; older profiles add it from "+". A pack without components leaves it waiting.
- **Zhuyin study cards:** a "Learn zhuyin" checkbox in Settings when pronunciation is Pinyin or
  Both. It adds a Zhuyin list (list kind script_study) of the 37 symbols and 5 tone marks, kept
  in code. Each card's reading is an example character's and its meanings are the sound and
  "as in 八 bā". Turning it off, or choosing zhuyin-only display, hides the list
  (`word_lists.is_hidden`) and keeps progress. Hidden lists' words still show in All words.
- No Unihan data was needed: the Components list only uses the curated names and meanings.

Phase 4 phone test (2026-11-10, Pixel 8 Pro, temporary profiles, deleted afterwards):
- Passed (Simplified profile): adding starter set 1 adds 50 words in Simplified with mainland
  readings, creates the missing lists, asks once to add 10 characters and shows "Set 1 of 10:
  0 of 50 learned". The Add Word split dialog for 杂货店 works (checked by the user).
- Passed (Traditional profile): the Components list fills with 59 cards (田: tián zì páng,
  field, 田字旁). Learn zhuyin adds a 42-card Zhuyin list (ㄚ: ā, a, as in 啊 ā); choosing
  zhuyin-only display hides the list and the checkbox, and Pinyin brings both back.
- Development note: a reload that copies the built-in pack while the update script is still
  writing it leaves an old copy (fixed by deleting files/SQLite/dictionary-v6.db with run-as).
  Released builds can't hit this.

Phase 4 notes for later phases:
- Starter words use the dictionary's first meanings for their list type, which can include odd
  ones (不客气: "impolite"). Curated meanings could be added to starter_words later.
- `word_parts` isn't shown on cards yet ("a card can later show its breakdown").
- A Simplified font pack still needs Simplified font subsets.

Phase 3 decisions (2026-11-08):
- **Pack file (.mfpack):** an 8-byte magic ("MFPACK", 0, format version 1), a 64-byte Ed25519
  signature, then the pack's SQLite database. The signature covers a context string plus the
  database's SHA-512, so the phone hashes the file natively instead of loading it into JavaScript.
- **Signature library:** `@noble/ed25519` (MIT, audited, one file, no dependencies, no network
  use), smaller than `@noble/curves`. Its hashing uses expo-crypto on the phone.
- **Signing key:** created with `npm run pack:generate-key`; the private key is at
  `~/.mandarin-flash/pack-signing-key.hex` on the development PC, never in the repository. Its
  public key is in `src/services/packs/trustedPackKeys.ts`. Back it up offline (docs/RELEASE.md).
  If you'd rather make a fresh key before the first published pack, do it before any pack ships.
- **One Mandarin pack serves Traditional and Simplified.** Entries are headword (Traditional),
  variant (Simplified), reading (Taiwan pinyin) and variant_reading (mainland pinyin); Simplified
  reads the pack through its variants (`DictionaryForm.readsVariants`). Sentences are stored once,
  in Taiwan Traditional, and converted for Simplified.
- **The built-in Mandarin pack** (`assets/data/mandarin-pack.db`, version 1) was converted from the
  Phase 2 dictionary without re-downloading sources, so its data is unchanged. The build script is
  now `npm run build:mandarin-pack`.
- **An installed pack replaces the built-in one** for its languages when its version is higher
  (e.g. a Mandarin data update without an app update). The same or an older version is refused.
- **Reliable word types and data licenses come from the pack** (pack metadata), not the language
  definition. The About screen lists every open pack's licenses, then the app's fonts and code.
- **Installed packs** are listed in the encrypted user database (`installed_packs`); the pack
  files live in app storage (databases next to the built-in copy, fonts in `packs/<name>/`). A
  replaced or removed pack's files are deleted at the next start, once nothing reads them.
- **Removing a pack** is refused while profiles learn a language no other pack serves. The
  built-in pack can't be removed.
- **Pack fonts** are used by languages without bundled fonts (Simplified now; future languages).
  Traditional keeps the three bundled Traditional fonts. Pack fonts are assumed to cover their
  language; Android fills any missing glyph from system fonts.
- **Route B** registers the app for downloaded files (`application/octet-stream`, and `.mfpack`
  paths) through `OpenedFileActivity`, a windowless activity added by
  `plugins/withOpenedFileActivity.ts`. It forwards the file to MainActivity in the app's own task;
  `src/app/+native-intent.tsx` sends an opened file to the install screen. Route C ("Install
  a pack file" on Settings → Language packs) uses the system file picker. iOS document types wait
  for the iOS port.
- **Default lists:** every profile also gets Adverbs; Mandarin profiles get Measure words. The
  Components list waits for Phase 4 (it needs its own list kind). Profiles made before Phase 3 can
  add Adverbs and Measure words from the "+" dialog, which also offers the suggested lists
  (Pronouns, Prepositions, Conjunctions, Numbers, Question words, Particles, Time words).
- **Mismatch warnings only judge reliable word types**, so Adverbs or Measure words never warn
  until a pack tags those reliably.
- The pack schema has no `search_key` column yet: Mandarin looks words up by exact headword or
  variant. Add it (schema 2) with the first language that needs folded lookups (German case,
  Russian stress marks).

Phase 3 phone test results (2026-11-08, Pixel 8 Pro, Android 17):
- Passed: suggested lists in "+" (an older profile is offered Adverbs and Measure words); Language
  packs screen; the tampered pack and a non-pack file are refused with the right messages;
  installing the signed version 2 writes its database and font; version 2 survives a restart;
  Remove works and the files are deleted at the next start; word-type checks still read the pack.
- Passed, real route B: Chrome downloaded the pack (served from the PC over adb reverse) and
  "Open" → Mandarin Flash showed the install screen and installed it; Done returns to the app.
- Fixed: About listed CC-CEDICT and Tatoeba twice when an update was installed.
- **Fixed (2026-11-10, phone retest pending):** opening a pack from Files by Google starts a second copy of the app's activity
  inside the Files task (Android 17 ignores `singleTask` there), so the app shows Practice with a
  "multiple navigation containers" warning instead of the install screen. Chrome's "Open" is
  unaffected. **Decided 2026-11-08: fix it with a small separate activity for opened files**,
  added through a config plugin (no hand edits to android/). It receives the file and hands it to
  MainActivity (singleTask), so only one copy of the app runs.
- Not checked: pack fonts on Simplified cards (needs a Simplified profile).

Phase 3 wrap-up (2026-11-10, phone-tested):
- Passed: opening a pack from Files by Google ("Open with" → Mandarin Flash) now shows the install
  screen in the app's own task; only one MainActivity runs and there is no "multiple navigation
  containers" warning.
- Passed, Simplified test profile with a Mandarin pack version 3 (with the jf open-huninn font)
  installed: cards alternate between the system font and the pack font, right after installing;
  practice and example sentences show Simplified. The test font is a Traditional subset, so
  Simplified-only characters (气, 书) fall back to the system font inside a card. A real Simplified
  font pack needs Simplified subsets.
- Fixed: the Language packs list repeated a key when an installed pack and the built-in pack had
  the same id and version.

Phase 3 is done; Phase 4 started on branch lang-compatibility-p4.

Phase 3 notes for later phases:
- `starter_words` exists in the pack schema but is empty; Phase 4 fills it for Mandarin. Since the
  built-in pack is version 1 on every phone, a starter-words update can ship either in the app or
  as a Mandarin pack version 2.
- `npm run pack:derive -- <pack.db> <out.db> --version <n> --font <file>` makes a new pack version
  (optionally with fonts); `npm run pack:sign -- <pack.db> <out>.mfpack` validates and signs it.
- Packs aren't hosted anywhere yet. A Simplified font pack needs SC font subsets (fonttools isn't
  installed on the development PC).
- Opening a pack from the browser's download notification (real route B) can only be checked once
  a pack is hosted, e.g. on a GitHub release.

Phase 3 phone test (needs `npx expo prebuild --platform android` first, because app.json gained
intent filters; then `npx expo run:android`). Test packs are in `dist/test-packs/` (git-ignored);
copy them with `adb push dist/test-packs/<file> /sdcard/Download/`:
1. Lists tab → "+": the suggested lists show; adding Pronouns makes a part-of-speech list. A new
   profile has Adverbs and Measure words.
2. Settings → Language packs: the built-in Mandarin pack, version 1. About shows CC-CEDICT and
   Tatoeba under "Language data" and noble-ed25519 under "Fonts and code".
3. Install `mandarin-v2-with-font.mfpack` with "Install a pack file": installed message; the list
   shows version 2; a Simplified profile's cards sometimes use the pack's font (jf open-huninn).
   Restart the app: version 2 is still in use. Remove it: the built-in pack is used again.
4. Open `mandarin-v2-with-font.mfpack` from the Files app ("Open with Mandarin Flash"): the install
   screen shows and installs it (route B, as far as it can be tested without hosting).
5. `mandarin-v2-tampered.mfpack` is refused as not signed; `not-a-pack.mfpack` as not a pack.
6. Practice, Add Word and example sentences still work in Traditional and Simplified.

Phase 2 decisions (2026-11-06):
- The welcome screen shows on launch only when there are two or more profiles; with one, the app
  opens straight into it. Settings shows "Switch profile" with several profiles and "Add a new
  user" with one.
- First run asks Traditional or Simplified and a name (default "Me").
- Mandarin (Simplified) follows mainland conventions: mainland readings (垃圾 lā jī) and word forms
  (软件, with 軟件 as its Traditional variant).
- Simplified cards use the system font for now; Simplified fonts come with packs, outside the base
  app's size budget.
- All words lists every meaning a word has in any of its lists (e.g. 車's verb meaning from Verbs).
- Profiles can be renamed and deleted (Settings → Edit profile). The original (first-created)
  profile can't be deleted, so there is always at least one. Deleting the active profile opens the
  only remaining one, or the welcome screen when several remain.
- A new profile counts as never used until someone picks it, so adding a user doesn't change which
  language the welcome screen opens on.
- The word-type tagger no longer defaults small grammatical words to "noun" (應 "should", 可 "but",
  謝謝 "thanks"), and the dictionary was rebuilt from current CC-CEDICT and Tatoeba exports.

Phase 2 notes for later phases:
- The bundled dictionary now stores mainland pinyin and has a Simplified index (15.6 MB).
  (Phase 3 turned it into the built-in Mandarin pack.)
- Adding a new user returns to the welcome screen so the new person can pick themselves.
- Screens are grouped with `Stack.Protected` in `src/app/_layout.tsx` (first run, welcome, app).
  `ProfileSessionContext` holds the session; `AppServicesProvider` gives each profile its own
  language bundle, dictionary lookup and settings.
- Not yet checked on the phone: first run on a fresh install, and adding a Chinese word as a
  Simplified user (adb can't type Chinese); automated tests cover both.

Phase 1 notes for later phases:
- (Done in Phase 3: the dictionary is now a pack with headword, variant and reading columns.)
- CSV export headers are still `character, meaning, pinyin` (from the language bundle); import also
  accepts the generic `word`/`headword` and `reading` headers.
- `PhoneticText`, `ChineseText` and the zhuyin conversion are still Mandarin-only components.
- On-screen text still says "Chinese characters" and "pinyin" in a few places (Add Word, CSV import
  summary); generalize it when a non-Mandarin language arrives.

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

## Health-related word sets

Optional sets of health vocabulary a learner can add when they need them, such as a short-term
traveler with diabetes adding only First aid and Diabetes, a woman with a broken leg adding Going
to the doctor, Injuries and Women's health, or a student adding Cold/Flu because they feel ill
today. Planned 2026-11-10 at the user's request; part of the MVP.

- **Sets (Mandarin, first draft):** Going to the doctor, Cold/Flu, Diabetes, Women's health,
  Wound infection, Chronic ailments, Medicine (including forgotten medication, refills and
  urgent refills during travel delays), First aid, Dental issues (including orthodontics) and
  Injuries. The user's draft lists are in `src/domain/healthRelatedWordLists.ts` (not yet
  committed); they become a curated data file under `scripts/data/`, like the starter words.
- **Where they live:** inside each language pack, like starter vocabulary, so "downloading" a
  set needs no network. The app stays offline; adding a set copies its words from the pack into
  the profile. On-screen text says "Add", not "download". A pack with no health sets hides the
  option. Each language's pack brings its own sets, curated for that language.
- **Curated meanings:** each entry carries its own English meaning(s), so health words don't
  depend on the dictionary's first glosses. Phrases that aren't dictionary words ("我的藥吃完了")
  are allowed.
- **Pack schema 3:** `word_sets` (set id, title, position) and `word_set_entries` (set id,
  position, headword, variant, reading, variant reading, meanings, languages). Entries are
  written like headwords (Traditional, Taiwan readings); Simplified reads them through the
  variants, like dictionary entries. An entry can be limited to one of the pack's languages,
  because some health terms differ by region (健保卡 is Taiwan's insurance card; mainland terms
  differ for some clinics and medicine brands such as 普拿疼). The tables are generic word sets,
  so later topics (travel, food) can reuse them.
- **In Settings:** "Add common health-related word sets" in each profile's Settings (each
  language). It opens a modal listing the sets with checkboxes and word counts. Sets the profile
  already added are greyed out, marked "Added" and listed at the bottom. Users can come back and
  add more sets later from the same place.
- **Target lists:** added words always go into a new default list, **Health-related words**, and
  into General Vocabulary. The modal also lets the user pick other lists (Focus Vocabulary or
  their own lists), unticked by default.
- **Repeats are skipped:** some words appear in more than one set (醫生, 藥局) or are already in
  the profile (from starter sets, CSV or Add Word). A word is stored once, matched by headword
  and reading, as with starter sets. The add summary says how many were new and how many the
  profile already had.
- **Remembering added sets:** a user-database table records which sets each profile added
  (profile, pack id, set id, time), so the modal can grey them out even if words are later
  removed from lists.
- **Compound splitting:** health words are mostly compounds, so after adding sets the app asks
  once whether to add their characters, as for starter sets (nouns only).
- **Word types:** the Health-related words list is a general list, so no word-type warnings.
  Entries may carry a curated word type; if they do, they could also go into the matching
  word-type list (see open questions).

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
4b. **Health-related word sets (MVP).** Curated Mandarin health sets in the pack (schema 3), the
   Settings modal for adding sets, the Health-related words default list, skipped repeats,
   remembering added sets, and the bulk character-splitting question.
5. **Store-hosted packs (route A):** Play Asset Delivery, then Apple-hosted packs with the iOS
   port.
6. **Add-ons framework and games.**
7. **OCR add-on.**
8. **New languages,** in this order: German (simplest, proves the pipeline), Japanese (best open
   data; reuses the Chinese groundwork), Korean, Scottish Gaelic (beta tester available), Irish
   (shares the mutation handling), Ukrainian, Russian (shares the Cyrillic work), Finnish,
   Arabic.

## Open questions

Health-related word sets (to settle before building Phase 4b; recommendations in brackets):
1. A word the profile already has: skip it entirely, or still add it to the Health-related words
   list (without changing its meanings)? [Add it to the list, so the list holds every word of
   the sets the user chose.]
2. Health-related words list: create it for every new profile (empty until a set is added), or
   only when the first set is added? [Only when the first set is added, so profiles that never
   use health sets don't get an empty list; re-create it if it was deleted.]
3. Should health words with a curated word type also go into Nouns, Verbs and so on, as starter
   words do? [No: keep them in Health-related words, General Vocabulary and the lists the user
   picks, so word-type lists don't fill with medical terms.]
4. Mainland (Simplified) equivalents: write mainland-only entries now, or leave Taiwan-only terms
   out of Simplified until a mainland reviewer checks them? [Write the obvious ones (医保卡,
   药店) now and mark uncertain ones for review.]
5. When a pack update adds words to a set a profile already added, offer "N new words in sets
   you added"? [Later; not needed for the MVP.]

Items marked "verify" above are checks to do during the relevant phase.
