# Mandarin Flash

An offline Android flashcard app for Traditional Chinese as used in Taiwan.
Built with React Native, TypeScript and Expo.

- **Spec:** [docs/spec.md](docs/spec.md)
- **Rules for Claude and contributors:** [CLAUDE.md](CLAUDE.md)
- **Building and releasing:** [docs/RELEASE.md](docs/RELEASE.md)
- **Data, font licenses and rebuilding bundled data:** [docs/THIRD_PARTY.md](docs/THIRD_PARTY.md)

## Commands

| Command | What it does |
|---|---|
| `npm run android` | Builds and runs a development build on an emulator or phone |
| `npm run check` | Runs typecheck, lint and all tests |
| `npm test` | Runs the tests only |
| `npm run build:dictionary -- <dir>` | Rebuilds `assets/data/dictionary.db` |
| `npm run build:font-characters` | Rebuilds the character list for the font subsets |

## Privacy

- **On-device only:** all user data stays on the phone, in a SQLCipher-encrypted database.
- **Key storage:** the database key is kept in the Android Keystore.
- **No network:** release builds have no internet permission.
- **Export:** data leaves the phone only when the user exports a CSV.
