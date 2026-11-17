# Building and releasing

## Development build (on a phone or emulator)

You need Android Studio (with an emulator or a USB-connected phone). Android Studio's bundled
Java works; set `JAVA_HOME` to `C:\Program Files\Android\Android Studio\jbr` and `ANDROID_HOME`
to `%LOCALAPPDATA%\Android\Sdk`.

### One-time Windows setup

react-native-reanimated (pulled in by expo-router) compiles C++ with paths longer than Windows'
260-character default limit. The default SDK CMake (3.22.1) ships ninja 1.10, which can't use
long paths, so the build fails with `ninja: error: mkdir(...): No such file or directory`.

1. Enable long paths (administrator PowerShell, then restart terminals):
   `New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force`
2. In Android Studio: SDK Manager → SDK Tools → Show Package Details → install CMake 4.0.2
   (or newer).
3. Point the build at it in `android/local.properties` (git-ignored; recreate it whenever
   `android/` is regenerated):
   `cmake.dir=C\:/Users/<you>/AppData/Local/Android/Sdk/cmake/4.0.2`
4. CMake 4 rejects expo-sqlite's old `cmake_minimum_required`, so set this before building:
   `$env:CMAKE_POLICY_VERSION_MINIMUM='3.5'`

### Build and run

```sh
npm install
npx expo run:android
```

Debug builds keep the INTERNET permission so they can load JavaScript from the Metro dev server.

On Android 17+ the debug app also asks for "nearby devices" (`ACCESS_LOCAL_NETWORK`) to reach
Metro over Wi-Fi. You can deny it and use the USB/adb tunnel instead:
`adb reverse tcp:8081 tcp:8081`, then set the dev server to `localhost:8081` (dev menu →
Settings → Debug server host). Release builds block this permission.

## Release build

Release builds **must** set `RELEASE_BUILD=1`. This strips the INTERNET permission
(see `app.config.ts`), so the shipped app has no network access at all, and the
development-only permissions ACCESS_LOCAL_NETWORK and SYSTEM_ALERT_WINDOW.

```sh
RELEASE_BUILD=1 npx expo prebuild --clean --platform android
cd android && ./gradlew bundleRelease   # Play Store (.aab)
cd android && ./gradlew assembleRelease # sideloading (.apk)
```

## Release checklist

1. `npm run check` passes.
2. The release build has no network permission:
   `aapt dump permissions android/app/build/outputs/apk/release/app-release.apk` must not list
   `android.permission.INTERNET`, `android.permission.ACCESS_LOCAL_NETWORK` or
   `android.permission.SYSTEM_ALERT_WINDOW`. Play Asset
   Delivery adds FOREGROUND_SERVICE, FOREGROUND_SERVICE_DATA_SYNC, WAKE_LOCK, ACCESS_NETWORK_STATE
   and RECEIVE_BOOT_COMPLETED; compare the rest with the previous release and justify anything new.
3. The download is 30 MB or less:
   `bundletool get-size total --apks=<apks built from the .aab>`.
4. The database is encrypted: run `adb exec-out run-as com.mandarinflash.app cat databases/user.db`
   on a test device. The output must not start with `SQLite format 3`.
5. docs/THIRD_PARTY.md and the About screen list every bundled data file and font.
6. The release build starts on a phone. R8 shrinks release code, and a library that looks up
   classes by name can crash only there (WorkManager's Room database did, 2026-11-17).

## Language packs

Packs other than the built-in Mandarin one are installed from signed `.mfpack` files. The app
accepts a pack only if a key in `src/services/packs/trustedPackKeys.ts` signed it.

- **Signing key.** `npm run pack:generate-key` created the private key at
  `~/.mandarin-flash/pack-signing-key.hex` (2026-11-06). It never goes in the repository. Back it
  up offline: if it is lost, new packs need an app update that trusts a new key; if it leaks,
  remove its public key from `trustedPackKeys.ts` in the next release.
- **Signing a pack.** `npm run pack:sign -- <pack.db> <name>.mfpack` validates the pack exactly as
  the app does, signs it and checks the signature against the trusted keys.
- **Publishing.** Attach the `.mfpack` to a GitHub release (or any static host). The app opens
  `.mfpack` files from the browser's download notification ("Open").

## Store-hosted packs (Play Asset Delivery, route A)

Packs listed in `src/domain/storePackCatalog.json` go into the app bundle (.aab) as on-demand
asset packs; `plugins/withPlayAssetPacks.ts` adds one Gradle module per pack at prebuild. The app
offers them on Settings → Language packs ("Available from Google Play") when Play can deliver
them, i.e. when the app was installed from Play. Play downloads the pack; the app then installs
the signed file exactly like a pack file the user opened, and deletes Play's copy.

- **Adding a store pack.** Sign it (`npm run pack:sign`) into `dist/store-packs/`, add an entry to
  the catalog (asset pack name: a letter, then letters, digits or underscores; pack id and version
  must match the file), then prebuild. A release build stops if a non-test pack's file is
  missing. Test packs (`"isTestPack": true`) only go into development builds.
- **APK builds ignore asset packs**, so `npx expo run:android` and sideloaded APKs never offer
  store packs; route B (opening a downloaded .mfpack) covers them.
- **Testing on a phone without Play (bundletool local testing):**

  ```sh
  npx expo prebuild --platform android   # then recreate android/local.properties if needed
  cd android && ./gradlew bundleDebug
  java -jar bundletool.jar build-apks --bundle=app/build/outputs/bundle/debug/app-debug.aab     --output=app-debug.apks --local-testing --overwrite --ks=app/debug.keystore     --ks-pass=pass:android --ks-key-alias=androiddebugkey --key-pass=pass:android
  java -jar bundletool.jar install-apks --apks=app-debug.apks
  ```

  Signing with the project's debug key installs over an existing debug build and keeps its data.
  Add `-PreactNativeArchitectures=arm64-v8a` to the Gradle command to build faster for one phone.
  Packs are then fetched from the phone's storage instead of Play. Local testing can't show
  network errors or the Wi-Fi/mobile data confirmation, and Google says updates aren't supported
  there (uninstall first if a pack doesn't show up; that deletes the app's data).
- **Before the first release with store packs (needs a Play Console account):**
  1. Upload the bundle to the internal test track and check that "Get" downloads and installs each
     pack on a phone that installed the app from Play.
  2. Fill in the foreground service declaration (App content → Foreground service permissions):
     type dataSync, used by Play Asset Delivery to unpack a language pack the user asked for. The
     video shows the user tapping Get on Settings → Language packs.
  3. Check the merged permissions (checklist item 2).
