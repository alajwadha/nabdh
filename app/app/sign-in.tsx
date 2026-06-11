import { useState } from 'react';
import { ActivityIndicator, Platform, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Card, AppText, Button } from '../src/design-system/components';
import { colors, radii, spacing } from '../src/design-system';
import { useAuth } from '../src/auth/AuthProvider';
import {
  signInWithApple,
  signInWithEmail,
  signUpWithEmail,
  useGoogleSignIn,
} from '../src/auth/methods';

export default function SignIn() {
  const { t } = useTranslation();
  const { configError } = useAuth();
  const router = useRouter();
  const { promptGoogle } = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') setError(prettyError(e));
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    color: colors.textPrimary,
    fontSize: 16,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  };

  return (
    <Screen>
      <View style={{ gap: spacing.sm, marginTop: spacing.xxl }}>
        <AppText variant="display">{t('app.name')}</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {t('auth.tagline')}
        </AppText>
      </View>

      {configError ? (
        <Card>
          <AppText variant="body" color={colors.warning}>
            {t('auth.configMissing')}
          </AppText>
        </Card>
      ) : (
        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.email')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={inputStyle}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.password')}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={inputStyle}
          />
          <Button label={t('auth.signIn')} onPress={() => run(() => signInWithEmail(email, password))} />
          <Button
            label={t('auth.createAccount')}
            onPress={() => run(() => signUpWithEmail(email, password))}
          />

          <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
            {t('auth.or')}
          </AppText>

          {Platform.OS === 'ios' && <Button label={t('auth.apple')} onPress={() => run(signInWithApple)} />}
          <Button label={t('auth.google')} onPress={() => promptGoogle()} />
          <Button label={t('auth.phone')} onPress={() => router.push('/phone')} />

          {busy && <ActivityIndicator color={colors.accent} />}
          {error && (
            <AppText variant="caption" color={colors.danger}>
              {error}
            </AppText>
          )}
        </View>
      )}

      <AppText variant="caption" color={colors.textMuted}>
        {t('auth.disclaimer')}
      </AppText>
    </Screen>
  );
}

function prettyError(e: any): string {
  const code: string = e?.code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password'))
    return 'Wrong email or password.';
  if (code.includes('email-already-in-use')) return 'That email already has an account. Try Sign in.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  return e?.message ?? 'Something went wrong.';
}
