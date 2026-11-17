import type { ConfigContext, ExpoConfig } from 'expo/config';

// Debug builds need INTERNET to load JavaScript from the Metro dev server.
// Release builds must have no network access, so the permission is stripped
// whenever RELEASE_BUILD=1 is set (see docs/RELEASE.md).
const isReleaseBuild = process.env.RELEASE_BUILD === '1';

// React Native's debug manifest also requests ACCESS_LOCAL_NETWORK (Android 17+) to reach Metro.
// Blocking it here too keeps any library from bringing it into a release build.
// SYSTEM_ALERT_WINDOW (drawing over other apps) comes from Expo's app template for development
// overlays; the released app never draws outside its own window.
const RELEASE_BLOCKED_PERMISSIONS = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_LOCAL_NETWORK',
  'android.permission.SYSTEM_ALERT_WINDOW',
];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    blockedPermissions: isReleaseBuild ? RELEASE_BLOCKED_PERMISSIONS : [],
  },
});
