import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '../design-system/components';
import { radii } from '../design-system';
import { useTheme } from '../design-system/theme';
import { useAppState } from '../store/app';
import { useIdentity } from '../data/identity';
import { Icon, type IconName } from './Icon';
import { Glass } from '../design-system/glass';

function HBtn({ icon, active, label, onPress }: { icon: IconName; active?: boolean; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  // Active = solid accent (a clear toggle state); inactive = a frosted-glass control that
  // echoes the glass tab bar.
  if (active) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: true }} hitSlop={6} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} color="#fff" />
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={active === undefined ? undefined : { selected: false }} hitSlop={6}>
      <Glass radius={radii.md} intensity={26} scrim="subtle" floating={false} style={{ width: 38, height: 38 }}>
        <View style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={19} color={colors.ink} />
        </View>
      </Glass>
    </Pressable>
  );
}

export function AppHeader() {
  const { colors, mode, toggle, tiles } = useTheme();
  const { ramadan, setRamadan } = useAppState();
  const identity = useIdentity();
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AppText style={{ fontSize: 19, fontWeight: '800' }}>
        Nabdh<AppText style={{ fontSize: 19, fontWeight: '800' }} color={colors.accentText}>.</AppText>
      </AppText>
      <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
        <HBtn icon="moon-star" active={ramadan} label="Ramadan mode" onPress={() => setRamadan(!ramadan)} />
        <HBtn icon={mode === 'dark' ? 'sun-medium' : 'moon'} label={mode === 'dark' ? 'Light mode' : 'Dark mode'} onPress={toggle} />
        <Pressable
          onPress={() => router.navigate('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: tiles.peach.bg, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText style={{ fontSize: 13.5, fontWeight: '800' }} color={tiles.peach.ink}>
            {identity.initial}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
