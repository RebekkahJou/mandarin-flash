# Multi-language and add-ons plan

Status: approved 2026-11-05. **Phase 1 done** (2026-11-05). **Phase 2 done** (2026-11-06,
tested on the phone; merged into main). **Phase 3 done** (2026-11-10, branch
lang-compatibility-p3, phone-tested, merged into main; see "Phase 3 wrap-up" below). **Phase 4
built and phone-tested** (2026-11-10, branch lang-compatibility-p4; see "Phase 4 decisions"
below). **Phases 4b and 4c built** (2026-11-13, branch lang-compatibility-p4b; automated tests
pass, phone test pending; see "Phase 4b and 4c decisions" below). Update this file as work lands
or decisions change.

Taiwan reading audit (2026-11-13). Traditional Mandarin always uses Taiwan readings; Simplified
keeps mainland ones:
- **Source:** CC-CEDICT gave a Taiwan reading for only 444 of 117,501 entries. Taiwan readings now
  come from Wiktionary (CC BY-SA 4.0, via kaikki.org): `npm run extract:taiwan-readings` writes
  scripts/data/mandarin-taiwan-readings.tsv (3,448 words whose Taiwan reading differs), and both
  pack scripts apply it. The Taiwan reading becomes `reading`; the mainland one `variant_reading`.
  Wiktionary is credited in the pack's licenses (About screen) and docs/THIRD_PARTY.md.
- **Rules:** Wiktionary's Taiwan-tagged reading wins; where both regions share a toned reading and
  CC-CEDICT stored the toneless variant (護士 hù shi), the toned one is used. Listed words are also
  swapped inside longer entries (不客氣 → bù kè qì), except directional complements (站起來 keeps
  its neutral 起來). Single characters keep CC-CEDICT's own Taiwan notes (期 qí): Wiktionary's
  character pages pair readings unreliably (吃 came out as the stutter reading jí).
- **Result:** 3,266 entries changed (休息 xiū xí, 星期 xīng qí, 研究 yán jiù, 認識 rèn shì, 衣服 yī fú,
  頭髮 tóu fǎ, 時候 shí hòu, 企 qì, 質 zhí, 菌 jùn). Entries that now share a reading (地方 "place" and
  "local", both dì fāng) are merged when the app reads them.
- **Curated data:** 34 starter words (e.g. 喜歡 xǐ huān, 朋友 péng yǒu, 漂亮 piào liàng, 便宜 pián yí,
  拜拜 bài bai, 突然 tú rán, 還是 hái shì) and 12 health entries (護士, 舒服 in two phrases, 咳嗽, 模糊,
  生理期, 細菌 jùn, 長期, 行李 twice, 休息, 跌倒) were updated; 一天三次 is written yī (base tone).
  The remaining neutral tones (謝謝, 東西, 意思, 麻煩, 清楚…) are neutral in Taiwan too. Component
  names needed no change. Simplified-only health entries keep mainland readings.
- **Saved words follow** (decided 2026-11-13): when a Traditional profile's lists first load
  with a new pack version, saved words read the mainland way get the Taiwan reading
  (`updateSavedReadings`, recorded per profile as `savedReadingsUpdatedForPack`). A reading that
  is still valid for another meaning, or with more than one possible replacement, is left alone.
  If the profile already has the Taiwan-read copy, the two merge: that copy keeps its meanings and
  learning level and gains the other's lists, practice history, character links and starter set.
  Bump `MANDARIN_PACK_VERSION` whenever readings change, or saved words won't be updated again.
- **Whole words win:** a word Wiktionary lists itself only follows its own readings, never the
  words inside it (亮堂堂 liàng táng tang; 不值得 keeps bù zhí de), so applying the file twice
  changes nothing. **The Mandarin pack is now version 4** (built-in copy version 9); test packs
  must be version 5+.

Taiwan readings phone test (2026-11-13, Pixel 8 Pro, fresh debug build, profile TEMP3 deleted after):
- The phone's pack matches the repo's version 4 pack (all 117,501 entries).
- "Me": the update ran and changed none of its 56 words (none had a replaced mainland reading).
- TEMP3: 休息 xiu1 xi5 and 地方 di4 fang5, imported by CSV, became xiū xí and dì fāng after the
  update ran again (forced with a temporary key change, since reverted).
- Adding the Cold/Flu set added 19 words; 咳嗽 shows ké sòu in General Vocabulary, Verbs and
  Health-related words. A hidden Zhuyin card reads "In hidden list: Zhuyin".

Phase 4b and 4c decisions (2026-11-13):
- **Curated health data** lives in scripts/data/mandarin-word-sets.tsv (set id, topic, title) and
  mandarin-word-set-entries.tsv (set id, headword, reading, word type, meanings separated by "; ",
  languages, curator note). It was converted from the user's draft (`healthRelatedWordLists.ts`,
  no longer in src/): 240 entries in 10 sets. Word types were assigned by hand (sentences and
  symptom phrases such as 喉嚨痛 are "phrase", 飯後 is a time word, 口渴/頭暈 are adjectives).
- **Taiwan readings throughout Traditional** (decided 2026-11-13, replacing "readings follow the
  dictionary"): see "Taiwan reading audit" below. 咳嗽 is ké sòu and 跌倒 dié dǎo again, and
  the dictionary now agrees. 子宮內膜異位症 keeps mó (Taiwan's reading; the draft's mò was a slip).
  跌倒's meaning lost its "(Taiwan reading die1)" note.
- **Regional entries:** Taiwan-only terms (健保卡, 家醫科, 藥局, 普拿疼, 衛生棉, 慢性病連續處方箋, 齒顎矯正,
  維持器, 戽斗, 閃到腰) are limited to zh-Hant; Simplified-only equivalents follow each (医保卡,
  药店, 卫生巾, 保持器; marked "review: mainland term" for 全科, 对乙酰氨基酚, 长期处方, 地包天, 闪了腰).
  Entries are written in Traditional; Simplified forms come from the dictionary or OpenCC.
- **Pack schema 3, Mandarin pack version 3** (built-in copy version 7). `word_sets` has a `topic`
  column so later topics (travel, food) reuse the tables. Test packs must now be version 4+.
- **Settings → "Health vocabulary"** shows only when the pack has health sets. Sets still to add
  come first; added ones are greyed out with "· Added" at the bottom. "Also add the words to"
  offers general lists other than General Vocabulary, Phrases, Time words and Health-related
  words (so Focus Vocabulary and the user's own lists). Added sets are remembered in
  `added_word_sets` (profile, pack, set).
- **Learning levels:** labels are High practice / Reinforcement / Retention; the word screen's
  section is "Learning level", with the practice-share note built from `PRACTICE_SET_TIER_RATIOS`.
- **Retention question:** turning off Learn zhuyin (when the Zhuyin list exists) and "Hide list"
  on the Components list ask "Move all … to Retention?" with "Move to Retention" / "Keep levels";
  either way the list is hidden. Choosing zhuyin-only display still hides the Zhuyin list without
  asking (not in the request). Only Components gets "Hide list"; "+" shows a hidden list of the
  suggested name again instead of making a new one.
- **All words:** an "Options" button opens View options (saved per profile in `settings`): Show
  zhuyin cards / Show components (only when the profile has them), Show Retention words, Show
  learning level. A note says how many words the options hide. A word only in hidden lists says
  "In hidden list: Zhuyin" (fixes the Phase 4 follow-up finding).

Word counts and the "0 words" check (2026-11-13, Pixel 8 Pro, profiles TEMP1-2, deleted after):
- The Lists tab's All words row and All words count only the words the view options show; All
  words notes hidden ones ("0 words (+59 hidden words)" with Show components off). Passed.
- A new profile's All words row shows 0 only while Components fills, then 59 by itself, so the
  Phase 4 follow-up finding no longer needs a fix. The health section showed after deleting a
  stale built-in pack copy (the development-only issue noted under Phase 4).
- The health modal lists the 10 sets with counts and offers Focus Vocabulary. Passed (visual).

Phase 4b and 4c phone test results (2026-11-13, Pixel 8 Pro, profiles TEMP4 Traditional and
TEMP5 Simplified, deleted after). All eight steps passed:
- 醫生 imported by CSV as "physician", then Going to the doctor + Cold/Flu with Focus Vocabulary:
  "Added 41 words … 1 word you already had was added to Health-related words"; 醫生 kept
  "physician" and joined Focus Vocabulary and Health-related words.
- Reopened, both sets sat greyed at the bottom with "· Added". After deleting Health-related
  words, adding First aid brought the list back with its 17 words.
- Word screen: "Learning level" with the 60% / 30% / 10% note and the three level chips.
- Learn zhuyin on, then off: the Retention question; "Move to Retention" hid the list, and hiding
  Retention words in All words read "118 words (+42 hidden words)".
- Components → Hide list (the question also says how to show it again) → Keep levels: the list
  left; "+" offered Components and restored the same list (59 cards, original place).
- All words: Show learning level off stayed off after leaving and returning; rows had no label.
- TEMP5 (Simplified): Going to the doctor 23 and Dental issues 37 words (Traditional 38); after
  adding, 医保卡 and 药店 were there, 健保卡 and 药局 weren't, and 休息 read xiū xi (mainland).

Phase 4b and 4c phone test (temporary profiles; reload so the version 3 pack is copied):
1. Traditional profile → Settings → "Add common health-related word sets": 10 sets with counts
   (Going to the doctor 23 words). Tick Cold/Flu and Diabetes, tick Focus Vocabulary, add: the
   characters question appears, then the summary. Lists tab shows Health-related words; Focus
   Vocabulary has the words; 喉嚨痛 is in Phrases and 口渴 in Adjectives.
2. Reopen the modal: Cold/Flu and Diabetes are greyed out at the bottom with "· Added". Delete
   the Health-related words list, add First aid: the list comes back with First aid's words.
3. Add 醫生 with Add Word (meaning changed to "physician"), then add Going to the doctor: the
   summary counts it as already had, and 醫生 joins Health-related words, still "physician".
4. Simplified profile → the same modal: Going to the doctor shows 医保卡 and 药店, not 健保卡/藥局.
5. A word's screen says "Learning level" with High practice / Reinforcement / Retention and the
   60% / 30% / 10% note; All words rows show the new labels.
6. Learn zhuyin on, then off: the Retention question shows; "Move to Retention" makes ㄅ show
   Retention in All words, with "In hidden list: Zhuyin".
7. Components list → "Hide list" → "Keep levels": the list leaves the Lists tab; "+" offers
   Components and brings back the same 59 cards with their levels.
8. All words → Options: untick Show components and Show learning level; components disappear,
   the note reads "N words (+59 hidden words)", labels are gone; the Lists tab's All words row
   shows N; leave and come back: the options are kept.

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

Phase 4 follow-up phone test (checks the first test didn't cover; use temporary profiles):
1. Traditional profile → Lists → Starter vocabulary → add set 1: 50 words in Traditional (謝謝,
   對不起, 老師, 學生, 書, 錢) with Taiwan readings; "Set 1 of 10: 0 of 50 learned".
2. Fresh Traditional profile: import `dist/test-packs/already-have.csv` (老師, 喜歡) first, then
   add set 1. Only 48 new words are added; neither word is duplicated in General Vocabulary or All words,
   and the set still shows "0 of 50 learned".
3. Settings → turn on "Learn zhuyin", then turn it off: the Zhuyin list disappears from Lists, its
   cards still show in All words, and turning it back on restores the list with the same cards.
4. Import `dist/test-packs/compounds.csv` (書包, 火車站, 喜歡) with CSV import: one dialog asks about
   splitting the two nouns' characters; the verb isn't offered.
5. Simplified profile → Components list: 言 shows as 讠 and 門 as 门, with Simplified names
   (門字框 → 门字框).
6. Older profile: delete its Components list, then add Components back from "+": it fills with 59
   cards.

Phase 4 follow-up phone test results (2026-11-13, Pixel 8 Pro, profiles TEMP1-3, deleted after):
- All six passed. Notes: (2) a word the profile already had stays only in its existing lists (老師
  wasn't added to Nouns), and its characters aren't offered for splitting; (3) progress was checked
  by marking ㄈ learned, which still showed Reinforcement after the list was hidden and restored;
  (4) the split dialog left out 書, which the profile already had.
- Fixed (2026-11-13, phone-checked): with many lists, the CSV import dialog's "Choose CSV file"
  button sat below the dialog, half under the navigation bar, and a tap just above it closed the
  dialog. `InfoModal` now scrolls long content so its button stays inside the card.
- Found: a hidden list's words show "Not in any list" in All words (ㄈ while Zhuyin was hidden).
  (Fixed in Phase 4c: they say "In hidden list: Zhuyin".)
- Found: right after a new profile is opened, All words shows 0 words until the tab is revisited,
  although the Components list has already filled. (2026-11-13: no longer happens; see below.)

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
- **Fixed (2026-11-10, retested in the wrap-up below):** opening a pack from Files by Google starts
  a second copy of the app's activity inside the Files task (Android 17 ignores `singleTask` there), so the app shows Practice with a
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
  committed); they became scripts/data/mandarin-word-sets.tsv and mandarin-word-set-entries.tsv
  (done 2026-11-13).
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
- **Target lists:** added words always go into **Health-related words** and General Vocabulary,
  and into the word-type list matching each entry's curated word type (Nouns, Verbs…), created if
  missing, as starter words do. The modal also lets the user pick other lists (Focus Vocabulary
  or their own lists), unticked by default. (Decided 2026-11-10.)
- **Health-related words list:** a default list that appears only when the profile adds its first
  set; it is created again if it was deleted. Profiles that never add a set don't get an empty
  list. (Decided 2026-11-10.)
- **Repeats are skipped:** some words appear in more than one set (醫生, 藥局) or are already in
  the profile (from starter sets, CSV or Add Word). A word is stored once, matched by headword
  and reading, as with starter sets. A word the profile already has keeps its meanings but is
  still added to the Health-related words list (if not there yet), so that list holds every word
  of the chosen sets. The add summary says how many were new and how many the profile already
  had. (Decided 2026-11-10.)
- **Remembering added sets:** a user-database table records which sets each profile added
  (profile, pack id, set id, time), so the modal can grey them out even if words are later
  removed from lists.
- **Compound splitting:** health words are mostly compounds, so after adding sets the app asks
  once whether to add their characters, as for starter sets (nouns only).
- **Word types:** every entry carries a curated word type (a part of speech, "phrase" or "time
  word", as for starter words). The Health-related words list is a general list, so it never
  shows word-type warnings.
- **Simplified:** obvious mainland equivalents (医保卡, 药店) are written now as Simplified-only
  entries; uncertain ones are marked for a mainland reviewer. (Decided 2026-11-10.)
- **Later, not in the MVP:** when a pack update adds words to a set a profile already added,
  offer "N new words in sets you added". (Decided 2026-11-10.)

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

## Learning levels and All words options (Phase 4c)

Requested 2026-11-13.

**Rename the tiers.** "High incidence" reads as how common a word is in everyday life, so the
tiers are renamed to how often they come up in practice:

- High incidence → **High practice**; Memory reinforcement → **Reinforcement**; Retention stays.
  (Only the labels change; the stored values `high_incidence` etc. stay, so no migration.)
- On a word's screen, the "Frequency" section becomes **"Learning level"**, with an info note built
  from `PRACTICE_SET_TIER_RATIOS`: "High practice words make up 60% of each practice set,
  Reinforcement words 30% and Retention words 10%."
- Use "learning level" everywhere the tier is shown or sorted (All words, the starter set text,
  docs/spec.md).

**Downgrade when a study list is hidden.** Turning off "Learn zhuyin" asks: "Move all zhuyin cards
to Retention? They'll come up rarely in practice and can be hidden from All words." Hiding the
Components list asks the same about components. A profile that never turned on Learn zhuyin has no
zhuyin cards, so nothing is asked.

- A word has one learning level, stored on the word, so every list it is in shows Retention too
  (decided 2026-11-13).
- Turning the list back on doesn't restore the old levels (they aren't stored). For the MVP the
  user changes them by hand on each word's screen. The dialog says so.

**Hide the Components list.** Components can be hidden like the Zhuyin list (`word_lists.is_hidden`,
progress kept), from the list's screen ("Hide list") with the downgrade question above, and shown
again from "+" (the suggested list brings the hidden one back instead of making a new one).
Hidden lists' words say "In hidden list: Components" in All words instead of "Not in any list".

**All words view options.** An options menu on All words, saved per profile in the encrypted
database:

- Filters: "Show zhuyin cards" (only offered when the profile has any), "Show components" (only
  when it has any) and "Show Retention words".
- "Show learning level" checkbox: shows or hides each word's level label.

## All words sorting (later phase)

Requested 2026-11-13; not needed in Phase 4 (decided 2026-11-13).

- Sort (one choice, in a pop-up menu on All words): the language's sorts (below), plus **English,
  A-Z** (by the first listed meaning) and **Learning level** (High practice first). Learning level
  takes an optional sub-sort within each level: any of the language's sorts or English. With no
  sub-sort, words keep today's order (newest first).

**Sorts depend on the language.** Each language definition lists its word sorts, so later
languages add their own without changing the screen (stroke and radical sorts never appear for
German, for example):

| Language | Sorts |
|---|---|
| Mandarin (Traditional) | Pinyin A-Z; Character (radical, then remaining strokes, as Taiwan dictionaries such as the MOE 國語辭典 do); Zhuyin (ㄅㄆㄇㄈ order, only when the display uses zhuyin or Learn zhuyin is on) |
| Mandarin (Simplified) | Pinyin A-Z (mainland dictionaries such as 现代汉语词典 are ordered by pinyin, so no separate character sort); Zhuyin under the same rule |
| Later (examples) | German: alphabetical with German collation (ä with a); Japanese: gojūon order of the reading, and kanji by radical; Korean: Hangul order |

- Pinyin sorts by letters, then tone (ma1 before ma2), syllable by syllable. Multi-character words
  sort by their first character, then the next.
- The radical sort needs each character's Kangxi radical and remaining stroke count. Take them
  from Unihan (`kRSUnicode`, `kTotalStrokes`; Unicode license, record in docs/THIRD_PARTY.md) and
  ship them in the Mandarin pack as a small characters table, only for characters the pack uses
  (a new pack schema version).
- Size, measured 2026-11-13 (Unihan 2026-07-31 on a copy of pack version 2): the pack uses 12,987
  distinct characters, and all but 22 have radical data (the 22 are punctuation, zhuyin and
  symbols such as 々 and 〇). A `characters` table (WITHOUT ROWID) of radical and remaining strokes
  adds 164 KB to the database, 47 KB compressed. Adding Simplified and Traditional total stroke
  counts makes it 212 KB, 52 KB compressed. Either is small against the 30 MB budget.
- Alphabetical sorts use `Intl.Collator` with the language's locale (verify Hermes on Android
  supports the needed locales).

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
4c. **Learning levels and All words options.** Tier labels renamed (High practice) with the
   practice-share note; the Retention downgrade question when Zhuyin or Components is hidden;
   hiding the Components list; All words filters and the level label checkbox.
5. **Store-hosted packs (route A):** Play Asset Delivery, then Apple-hosted packs with the iOS
   port.
6. **Add-ons framework and games.**
7. **OCR add-on.**
7b. **All words sorting.** Per-language sorts from the language definition, English and learning
   level sorts, and radical data in the Mandarin pack. Before the new languages, since each brings
   its own sorts.
8. **New languages,** in this order: German (simplest, proves the pipeline), Japanese (best open
   data; reuses the Chinese groundwork), Korean, Scottish Gaelic (beta tester available), Irish
   (shares the mutation handling), Ukrainian, Russian (shares the Cyrillic work), Finnish,
   Arabic.

## Open questions

None at the moment (the health word set questions were answered 2026-11-10). Items marked "verify" above are checks to do during the relevant phase.
