import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, AppText, Button } from '../src/design-system/components';
import { colors, spacing } from '../src/design-system';

// Phone OTP UI. The actual send/verify is finalized on-device because Firebase
// JS SDK phone auth needs a reCAPTCHA verifier (or switch to native
// @react-native-firebase/auth). See app/src/auth/methods.ts startPhoneSignIn.
export default function Phone() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('+966');

  return (
    <Screen>
      <AppText variant="h1">{t('auth.phone')}</AppText>

      <Card>
        <AppText variant="caption" color={colors.textMuted}>
          {t('phone.label')}
        </AppText>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+9665XXXXXXXX"
          placeholderTextColor={colors.textMuted}
          style={{ color: colors.textPrimary, fontSize: 22, paddingVertical: spacing.sm }}
        />
      </Card>

      <Card>
        <AppText variant="caption" color={colors.warning}>
          {t('phone.note')}
        </AppText>
      </Card>

      <Button label={t('phone.send')} onPress={() => { /* wired during on-device setup */ }} />
    </Screen>
  );
}
