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
(see `app.config.ts`), so the shipped app has no network access at all.

```sh
RELEASE_BUILD=1 npx expo prebuild --clean --platform android
cd android && ./gradlew bundleRelease   # Play Store (.aab)
cd android && ./gradlew assembleRelease # sideloading (.apk)
```

## Release checklist

1. `npm run check` passes.
2. The release build has no network permission:
   `aapt dump permissions android/app/build/outputs/apk/release/app-release.apk` must not list
   `android.permission.INTERNET` or `android.permission.ACCESS_LOCAL_NETWORK`.
3. The download is 30 MB or less:
   `bundletool get-size total --apks=<apks built from the .aab>`.
4. The database is encrypted: run `adb exec-out run-as com.mandarinflash.app cat databases/user.db`
   on a test device. The output must not start with `SQLite format 3`.
5. docs/THIRD_PARTY.md and the About screen list every bundled data file and font.
