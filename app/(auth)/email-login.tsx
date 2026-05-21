import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import Button from '@/components/Button';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', passwordConfirm: '' });
  const [loading, setLoading] = useState(false);
  const [passwordConfirmTouched, setPasswordConfirmTouched] = useState(false);

  const validate = () => {
    const next = { email: '', password: '', passwordConfirm: '' };

    if (!email.trim()) {
      next.email = '이메일을 입력해주세요.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!password) {
      next.password = '비밀번호를 입력해주세요.';
    } else if (password.length < 6) {
      next.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    if (!passwordConfirm) {
      next.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (password !== passwordConfirm) {
      next.passwordConfirm = '비밀번호가 일치하지 않습니다.';
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
        // 로그인 성공 — _layout.tsx의 onAuthStateChange가 /(tabs)로 이동
        return;
      }

      // 로그인 실패 → 신규 가입 시도
      if (signInError.message.includes('Invalid login credentials') || signInError.status === 400) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (!signUpError) {
          // 가입 후 자동 로그인 — _layout.tsx의 onAuthStateChange가 /(tabs)로 이동
          return;
        }

        if (signUpError.message.includes('already registered')) {
          setErrors((prev) => ({ ...prev, password: '비밀번호가 올바르지 않습니다.' }));
        } else if (
          signUpError.code === 'over_email_send_rate_limit' ||
          signUpError.status === 429
        ) {
          setErrors((prev) => ({ ...prev, email: '잠시 후 다시 시도해주세요.' }));
        } else {
          setErrors((prev) => ({ ...prev, email: '오류가 발생했습니다. 다시 시도해주세요.' }));
          Sentry.captureException(signUpError);
        }
      } else {
        setErrors((prev) => ({ ...prev, email: '오류가 발생했습니다. 다시 시도해주세요.' }));
        Sentry.captureException(signInError);
      }
    } catch (e) {
      console.error('[EmailLogin] handleSubmit threw:', e);
      Sentry.captureException(e);
      setErrors((prev) => ({ ...prev, email: '오류가 발생했습니다. 다시 시도해주세요.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="px-5" style={{ marginTop: 60 }}>
          {/* 헤더: 뒤로가기 + 타이틀 */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowBackIcon width={24} height={24} />
            </TouchableOpacity>
            <Text className="text-title-lg">이메일로 시작하기</Text>
          </View>

          {/* 폼 */}
          <View className="mt-10 gap-6">
            {/* 이메일 */}
            <View className="gap-2">
              <Text className="text-label-md">이메일</Text>
              <TextInput
                placeholder="이메일"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                rounded={12}
                onChangeText={(v) => {
                  setEmail(v);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                onBlur={() => {
                  const trimmed = email.trim();
                  if (trimmed && !EMAIL_REGEX.test(trimmed)) {
                    setErrors((prev) => ({ ...prev, email: '올바른 이메일 형식을 입력해주세요.' }));
                  }
                }}
                className={errors.email ? 'border border-red-500' : ''}
              />
              {errors.email ? <Text className="text-red-500 px-1">{errors.email}</Text> : null}
            </View>

            {/* 비밀번호 */}
            <View className="gap-2">
              <Text className="text-label-md">비밀번호</Text>
              <TextInput
                placeholder="비밀번호 (6자 이상)"
                secureTextEntry
                rounded={12}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={errors.password ? 'border border-red-500' : ''}
              />
              {errors.password ? (
                <Text className="text-red-500 px-1">{errors.password}</Text>
              ) : null}
            </View>

            {/* 비밀번호 확인 */}
            <View className="gap-2">
              <Text className="text-label-md">비밀번호 확인</Text>
              <TextInput
                placeholder="비밀번호 확인"
                secureTextEntry
                rounded={12}
                value={passwordConfirm}
                onFocus={() => setPasswordConfirmTouched(true)}
                onChangeText={(v) => {
                  setPasswordConfirm(v);
                  if (passwordConfirmTouched) {
                    setErrors((prev) => ({
                      ...prev,
                      passwordConfirm: v !== password ? '비밀번호가 일치하지 않습니다.' : '',
                    }));
                  }
                }}
                className={errors.passwordConfirm ? 'border border-red-500' : ''}
              />
              {errors.passwordConfirm ? (
                <Text className="text-red-500 px-1">{errors.passwordConfirm}</Text>
              ) : null}
            </View>
          </View>

          {/* 계속하기 버튼 */}
          <View className="mt-10">
            <Button
              label="계속하기"
              onClick={() => void handleSubmit()}
              loading={loading}
              disabled={!email || !password || !passwordConfirm}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
