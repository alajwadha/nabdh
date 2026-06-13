import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { AppText, Sheet } from '../../src/design-system/components';
import { radii, spacing } from '../../src/design-system';
import { useTheme } from '../../src/design-system/theme';
import { useAppState } from '../../src/store/app';

const TAB_LABELS: Record<string, string> = {
  index: 'tab.today',
  sleep: 'tab.sleep',
  food: 'tab.food',
  coach: 'tab.coach',
};

function QuickMenuRow({ icon, bg, title, subtitle, onPress }: { icon: string; bg: string; title: string; subtitle: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: colors.border }}>
      <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <AppText style={{ fontSize: 19 }}>{icon}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="title">{title}</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '500' }}>
          {subtitle}
        </AppText>
      </View>
    </Pressable>
  );
}

function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, tiles } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { addWater } = useAppState();
  const [menu, setMenu] = useState(false);
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => TAB_LABELS[r.name]);

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 + insets.bottom }}>
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.navBg, borderRadius: 999, padding: 6 }}>
          {routes.map((route) => {
            const i = state.routes.indexOf(route);
            const focused = state.index === i;
            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 999, backgroundColor: focused ? colors.navOn : 'transparent' }}
              >
                <AppText variant="caption" color={focused ? colors.navOnText : colors.textMuted} style={{ fontSize: 12.5 }}>
                  {t(TAB_LABELS[route.name])}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={() => setMenu(true)}
          style={{ width: 56, height: 56, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText color="#fff" style={{ fontSize: 26, fontWeight: '700', lineHeight: 28 }}>
            ＋
          </AppText>
        </Pressable>
      </View>

      <Sheet visible={menu} onClose={() => setMenu(false)}>
        <QuickMenuRow icon="📷" bg={tiles.mint.bg} title={t('quick.snap')} subtitle={t('quick.snapSub')} onPress={() => { setMenu(false); router.navigate('/(tabs)/food'); }} />
        <QuickMenuRow icon="💧" bg={tiles.blue.bg} title={t('quick.water')} subtitle={t('quick.waterSub')} onPress={() => { addWater(); setMenu(false); }} />
        <QuickMenuRow icon="💬" bg={tiles.peach.bg} title={t('quick.coach')} subtitle={t('quick.coachSub')} onPress={() => { setMenu(false); router.navigate('/(tabs)/coach'); }} />
      </Sheet>
    </>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="sleep" />
      <Tabs.Screen name="food" />
      <Tabs.Screen name="coach" />
    </Tabs>
  );
}
