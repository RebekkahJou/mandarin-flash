# Taiwan Mandarin Flash — rules for Claude

@AGENTS.md

## Product
Offline Android flashcard app for Traditional Chinese (Taiwan). React Native + TypeScript (Expo).
The spec lives in docs/spec.md. Read it before adding features.

## Project layout
- `src/app/`: expo-router screens. Keep them thin, with no business logic.
- `src/domain/`: pure TypeScript business rules. Never import React Native, Expo or SQLite here.
- `src/data/`: SQLite access only (database, migrations, repositories). Repositories depend on the
  `SqlDatabase` interface, never on expo-sqlite directly, so they can be tested in Node.
- `src/services/`: dictionary lookup, Chinese conversion, zhuyin, CSV, font rotation.
- `src/ui/components/`: reusable presentational components. `src/ui/hooks/`: orchestration hooks.
- `scripts/`: build-time tools (dictionary builder, font subsetting). These never ship in the app.

## Privacy first (non-negotiable)
- No network calls, analytics, telemetry, ads or crash-reporting SDKs. Release builds strip the
  INTERNET permission (app.config.ts). Do not add it back.
- All user data lives in the encrypted SQLite DB (SQLCipher). Never write user data to plain files,
  AsyncStorage or logs. The DB key lives only in expo-secure-store.
- Data leaves the device only through an explicit user action (CSV export through the share sheet).
- Treat imported files as untrusted: validate them, enforce size limits, never eval. Escape formula
  cells on export.
- Every new dependency must be justified. Reject any that phone home or request extra permissions.
- Ask before adding any feature that would transmit data. Such features must be opt-in.

## Clean code
- Single responsibility: screens render, hooks orchestrate, src/domain holds business rules and
  src/data holds persistence.
- Small functions (aim for under 30 lines), early returns, no dead code, no commented-out code.
- No magic numbers or strings. Use named constants (e.g. PRACTICE_SET_TIER_RATIOS).
- TypeScript strict. No `any`, and no non-null `!` without a comment explaining why.
- Comments explain *why*, not *what*.

## Naming
- Use full descriptive names: `practiceSetSize`, not `n` or `sz`. Booleans read as questions
  (`isRevealed`, `hasSimplifiedForm`).
- Components are PascalCase, hooks are `useX`, and files are named after their main export. Domain
  terms match the spec: Word, WordList, PartOfSpeechWordList, FrequencyTier, PracticeSession.

## Reusable components
- Search src/ui/components and src/services before creating anything new. Extend rather than duplicate.
- Components are presentational and take props. No direct DB access inside components.
- Share styling through the theme tokens in src/ui/theme.ts. No inline hex colors.
- Tappable things use cerulean (`colors.primary`) with white text. Never put text on an orange
  background: orange (`colors.accent`) is only for highlights, decorations, art and icons. Where
  orange is itself text or a thin line, use `colors.accentStrong`.
- Text color pairings must meet WCAG AA contrast (4.5:1).
- Smoky rose (#825E64) and deep teal (#3F5F57) look almost identical with protanopia and
  achromatopsia. Never pair them where the user has to tell them apart to use the app (e.g.
  side-by-side buttons, status colors, legends). If two meanings need different colors,
  also differ them by label, icon or lightness, and don't use color alone.

## JSX markup
- No ternaries in JSX markup (the returned elements and their props). This covers conditional
  rendering (`{isX ? <A /> : <B />}`, `{isX && <A />}`) and conditional props or styles.
- No other code evaluation inside the markup either: string building, `.join()`, arithmetic,
  comparisons and function calls that compute a value.
- Do that logic in the component body (or a hook), assign it to a well-named variable or element
  (`const mismatchSummary = hasMismatches ? <Text>…</Text> : null;`) and render the variable.
- Allowed in markup: plain variables and props, event handlers, and `.map()` to render a list.

## Data model rules
- A word's frequency tier is stored once, on the `words` row. Lists only reference words, so a tier
  change applies to every list. Never copy tier onto list entries.
- Pinyin is always stored (numbered tones). Zhuyin is derived from it at display time, never stored.
- Traditional Mandarin always uses Taiwan readings and meanings; Simplified uses mainland ones.
  Taiwan readings come from scripts/data/mandarin-taiwan-readings.tsv. Curated data (starter
  words, word sets) is written with Taiwan readings.
- List length is computed with COUNT, never cached.

## Testing & checks
- Every domain and service function has Jest unit tests. Add or update tests with every change.
- Run `npm run check` (tsc + lint + jest) before declaring work done, and report failures honestly.

## Size budget
- The release download must stay at or under 30 MB. Bundled fonts are subsets. Don't add large
  assets or dependencies without checking their size impact.

## Licensing
- Bundled data and fonts must be open-licensed. Record each one in docs/THIRD_PARTY.md and on the
  About screen.
