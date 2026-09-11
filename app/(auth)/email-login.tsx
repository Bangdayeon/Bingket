import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import Button from '@/components/Button';
import VisibilityIcon from '@/assets/icons/ic_visibility.svg';
import VisibilityOffIcon from '@/assets/icons/ic_visibility_off.svg';
import { PageHeader } from '@/components/PageHeader';

import { useTranslation } from 'react-i18next';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function EmailLoginScreen() {
  const { t } = useTranslation();
  const STRONG_PASSWORD_MESSAGE = t('auth.passwordPlaceholder');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', passwordConfirm: '' });
  const [loading, setLoading] = useState(false);
  const [passwordConfirmTouched, setPasswordConfirmTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const canSubmit =
    EMAIL_REGEX.test(email.trim()) &&
    !!password &&
    !!passwordConfirm &&
    password === passwordConfirm;

  const validate = () => {
    const next = { email: '', password: '', passwordConfirm: '' };

    if (!email.trim()) {
      next.email = t('auth.emailPlaceholder');
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = t('auth.invalidEmail');
    }

    if (!password) {
      next.password = t('auth.passwordPlaceholder');
    } else if (password.length < 6) {
      next.password = t('auth.signup.invalidPassword');
    }

    if (!passwordConfirm) {
      next.passwordConfirm = t('auth.signup.missingPasswordConfirm');
    } else if (password !== passwordConfirm) {
      next.passwordConfirm = t('auth.signup.invalidPasswordConfirm');
    }

    setErrors(next);
    return !next.email && !next.password && !next.passwordConfirm;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    const trimmedEmail = email.trim();

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (!signInError) {
        // login success — _layout.tsx의 onAuthStateChange가 / move to (tabs)
        return;
      }

      // login fail → try signin
      if (signInError.message.includes('Invalid login credentials') || signInError.status === 400) {
        // signin
        if (!STRONG_PASSWORD_REGEX.test(password)) {
          setErrors((prev) => ({ ...prev, password: STRONG_PASSWORD_MESSAGE }));
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (!signUpError) {
          // auto login after signin — _layout.tsx's onAuthStateChange / move to (tabs)
          return;
        }

        if (signUpError.message.includes('already registered')) {
          setErrors((prev) => ({ ...prev, password: t('auth.signup.alreadyRegistered') }));
        } else if (
          signUpError.code === 'over_email_send_rate_limit' ||
          signUpError.status === 429
        ) {
          setErrors((prev) => ({
            ...prev,
            email: `${t('common.error.general')} ${t('common.error.retry')}`,
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            email: `${t('common.error.general')} ${t('common.error.retry')}`,
          }));
          Sentry.captureException(signUpError);
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          email: `${t('common.error.general')} ${t('common.error.retry')}`,
        }));
        Sentry.captureException(signInError);
      }
    } catch (e) {
      console.error('[EmailLogin] handleSubmit threw:', e);
      Sentry.captureException(e);
      setErrors((prev) => ({
        ...prev,
        email: `${t('common.error.general')} ${t('common.error.retry')}`,
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <PageHeader title={t('auth.login.emailStart')} />

        <View className="flex-1 px-4">
          {/* FORM */}
          <View className="mt-7 gap-5">
            {/* EMAIL */}
            <View className="gap-2">
              <Text className="text-body-sm text-gray-900">{t('auth.email')}</Text>
              <TextInput
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                onBlur={() => {
                  const trimmed = email.trim();
                  if (trimmed && !EMAIL_REGEX.test(trimmed)) {
                    setErrors((prev) => ({ ...prev, email: t('auth.invalidEmail') }));
                  }
                }}
                className={errors.email ? 'border border-danger' : ''}
              />
              {errors.email ? <Text className="text-danger px-1">{errors.email}</Text> : null}
            </View>

            {/* PASSWORD */}
            <View className="gap-2">
              <Text className="text-body-sm text-gray-900">{t('auth.password')}</Text>
              <TextInput
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry={!showPassword}
                value={password}
                rightIcon={
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    {showPassword ? (
                      <VisibilityOffIcon width={24} height={24} className="text-gray-600" />
                    ) : (
                      <VisibilityIcon width={24} height={24} className="text-gray-600" />
                    )}
                  </Pressable>
                }
                onChangeText={(v) => {
                  setPassword(v);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={errors.password ? 'border border-danger' : ''}
              />
              {errors.password ? <Text className="text-danger px-1">{errors.password}</Text> : null}
            </View>

            {/* PASSWORD CONFIRM */}
            <View className="gap-2">
              <Text className="text-body-sm text-gray-900">
                {t('auth.signup.passwordConfirmPlaceholder')}
              </Text>
              <TextInput
                placeholder={t('auth.signup.passwordConfirmPlaceholder')}
                secureTextEntry={!showPasswordConfirm}
                value={passwordConfirm}
                rightIcon={
                  <Pressable onPress={() => setShowPasswordConfirm((v) => !v)} hitSlop={8}>
                    {showPasswordConfirm ? (
                      <VisibilityOffIcon width={24} height={24} className="text-gray-600" />
                    ) : (
                      <VisibilityIcon width={24} height={24} className="text-gray-600" />
                    )}
                  </Pressable>
                }
                onFocus={() => setPasswordConfirmTouched(true)}
                onChangeText={(v) => {
                  setPasswordConfirm(v);
                  if (passwordConfirmTouched) {
                    setErrors((prev) => ({
                      ...prev,
                      passwordConfirm:
                        v !== password ? t('auth.signup.invalidPasswordConfirm') : '',
                    }));
                  }
                }}
                className={errors.passwordConfirm ? 'border border-danger' : ''}
              />
              {errors.passwordConfirm ? (
                <Text className="text-danger px-1">{errors.passwordConfirm}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View className="px-4 pb-9">
          <Button
            label={t('auth.continue')}
            onClick={() => void handleSubmit()}
            loading={loading}
            disabled={!canSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
