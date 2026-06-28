import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '../design-system/components';
import { radii } from '../design-system';
import { useTheme } from '../design-system/theme';
import { useAppState } from '../store/app';
import { useIdentity } from '../data/identity';
import { Icon, type IconName } from './Icon';

function HBtn({ icon, active, onPress }: { icon: IconName; active?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: active ? colors.accent : colors.navBg, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name={icon} size={19} color={active ? '#fff' : colors.ink} />
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
        <HBtn icon="moon-star" active={ramadan} onPress={() => setRamadan(!ramadan)} />
        <HBtn icon={mode === 'dark' ? 'sun-medium' : 'moon'} onPress={toggle} />
        <Pressable
          onPress={() => router.navigate('/profile')}
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
