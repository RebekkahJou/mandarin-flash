import { Tabs } from 'expo-router';

import { TabIcon } from '../../ui/components/TabIcon';
import { colors } from '../../ui/theme';

const TAB_ICON_CHARACTERS = {
  practice: '練',
  lists: '詞',
  settings: '設',
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.background },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
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
  );
}
