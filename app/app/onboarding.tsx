import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GOAL_TYPES, type ConsentType, type GoalType } from '@nabdh/shared';
import { Screen, Card, AppText, Button } from '../src/design-system/components';
import { Icon } from '../src/components/Icon';
import { colors, radii, spacing } from '../src/design-system';
import { useAuth } from '../src/auth/AuthProvider';
import { ConsentGate } from '../src/features/consent/ConsentGate';
import { CONSENT_I18N, setConsent } from '../src/features/consent/consent';
import { saveGoals } from '../src/services/profile';

const ONBOARDING_CONSENTS: ConsentType[] = ['pdpl_processing', 'healthkit', 'ai_cross_border'];

export default function Onboarding() {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<GoalType[]>([]);
  const [consents, setConsents] = useState<Partial<Record<ConsentType, boolean>>>({});
  const [saving, setSaving] = useState(false);

  const toggleGoal = (g: GoalType) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const decide = (type: ConsentType, granted: boolean) =>
    setConsents((prev) => ({ ...prev, [type]: granted }));

  // Re-open a decided consent so the choice can be changed before finishing.
  const reopen = (type: ConsentType) =>
    setConsents((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });

  const pdplGranted = consents.pdpl_processing === true;

  const finish = async () => {
    if (!user || !pdplGranted || saving) return;
    setSaving(true);
    try {
      await Promise.all([
        ...ONBOARDING_CONSENTS.map((type) => setConsent(user.uid, type, !!consents[type])),
        saveGoals(user.uid, goals),
      ]);
      await refreshProfile();
      router.replace('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppText variant="h1">{t('onboarding.title')}</AppText>

      <AppText variant="title">{t('onboarding.goalsTitle')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {GOAL_TYPES.map((g) => {
          const active = goals.includes(g);
          return (
            <Pressable
              key={g}
              accessibilityRole="button"
              accessibilityLabel={t(`goal.${g}`)}
              accessibilityState={{ selected: active }}
              hitSlop={6}
              onPress={() => toggleGoal(g)}
              style={{
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
                backgroundColor: active ? colors.accentDim : 'transparent',
              }}
            >
              <AppText variant="caption" color={active ? colors.accent : colors.textSecondary}>
                {t(`goal.${g}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="title">{t('onboarding.consentsTitle')}</AppText>
      {ONBOARDING_CONSENTS.map((type) =>
        consents[type] === undefined ? (
          <ConsentGate key={type} type={type} onDecide={(g) => decide(type, g)} />
        ) : (
          <Card key={type}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View
                accessible
                accessibilityLabel={`${t(CONSENT_I18N[type].titleKey)}, ${consents[type] ? 'granted' : 'declined'}`}
                style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: consents[type] ? colors.accentDim : colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name={consents[type] ? 'check' : 'x'} size={15} color={consents[type] ? colors.accent : colors.textMuted} />
              </View>
              <AppText variant="caption" color={consents[type] ? colors.accent : colors.textMuted} style={{ flex: 1 }}>
                {t(CONSENT_I18N[type].titleKey)}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Change ${t(CONSENT_I18N[type].titleKey)}`}
                hitSlop={8}
                onPress={() => reopen(type)}
              >
                <AppText variant="caption" color={colors.textSecondary}>Change</AppText>
              </Pressable>
            </View>
          </Card>
        ),
      )}

      {!pdplGranted && (
        <AppText variant="caption" color={colors.textMuted}>
          {t('onboarding.needPdpl')}
        </AppText>
      )}

      <Button label={saving ? t('home.syncing') : t('onboarding.finish')} onPress={finish} />
    </Screen>
  );
}
