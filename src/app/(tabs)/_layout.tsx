import { Tabs, useIsFocused } from 'expo-router';
import type { StatusBarStyle } from 'expo-status-bar';
import { StatusBar } from 'expo-status-bar';

import { TabIcon } from '../../ui/components/TabIcon';
import { colors } from '../../ui/theme';

const TAB_ICON_CHARACTERS = {
  practice: '練',
  lists: '詞',
  settings: '設',
} as const;

const TAB_SCREEN_OPTIONS = {
  tabBarActiveTintColor: colors.accentStrong,
  tabBarInactiveTintColor: colors.textSecondary,
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.onPrimary,
  sceneStyle: { backgroundColor: colors.background },
};

export default function TabsLayout() {
  // The cerulean header runs under the status bar, so its icons are light while a tab shows.
  // Pushed screens have cream headers; this mounts after the root StatusBar, so it must hand
  // back the dark style when the tabs are covered.
  const isFocused = useIsFocused();
  const statusBarStyle: StatusBarStyle = isFocused ? 'light' : 'dark';
  return (
    <>
      <StatusBar style={statusBarStyle} />
      <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Practice',
            tabBarIcon: ({ color }) => (
              <TabIcon character={TAB_ICON_CHARACTERS.practice} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="lists"
          options={{
            title: 'Word lists',
            tabBarIcon: ({ color }) => (
              <TabIcon character={TAB_ICON_CHARACTERS.lists} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <TabIcon character={TAB_ICON_CHARACTERS.settings} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
