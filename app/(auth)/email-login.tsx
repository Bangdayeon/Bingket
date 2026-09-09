import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import Button from '@/components/Button';
import VisibilityIcon from '@/assets/icons/ic_visibility.svg';
import { PageHeader } from '@/components/PageHeader';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 시안 안내 문구(8자 이상 영문·숫자·특수문자)는 '신규 가입'에만 적용한다.
// 로그인 단계에서 막으면 이 규칙 이전에 가입한 계정이 들어올 수 없다.
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const STRONG_PASSWORD_MESSAGE = '8자 이상 영문, 숫자, 특수문자를 포함해주세요.';

export default function EmailLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', passwordConfirm: '' });
  const [loading, setLoading] = useState(false);
  const [passwordConfirmTouched, setPasswordConfirmTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

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
        // 여기부터는 신규 가입 — 시안의 비밀번호 규칙을 지킨다
        if (!STRONG_PASSWORD_REGEX.test(password)) {
          setErrors((prev) => ({ ...prev, password: STRONG_PASSWORD_MESSAGE }));
          return;
        }

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
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <PageHeader title="이메일로 시작하기" />

        <View className="flex-1 px-4">
          {/* 폼 */}
          <View className="mt-7 gap-5">
            {/* 이메일 */}
            <View className="gap-2">
              <Text className="text-body-sm text-gray-900">이메일</Text>
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
                    setErrors((prev) => ({ ...prev, email: '올바른 이메일 형식을 입력해주세요.' }));
                  }
                }}
                className={errors.email ? 'border border-danger' : ''}
              />
              {errors.email ? <Text className="text-danger px-1">{errors.email}</Text> : null}
            </View>

            {/* 비밀번호 */}
            <View className="gap-2">
              <Text className="text-body-sm text-gray-900">비밀번호</Text>
              <TextInput
                placeholder="8자 이상 영문,숫자,특수문자 포함"
                secureTextEntry={!showPassword}
                value={password}
                rightIcon={
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    <VisibilityIcon width={24} height={24} className="text-gray-600" />
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

            {/* 비밀번호 확인 */}
            <View className="gap-2">
              <Text className="text-body-sm text-gray-900">비밀번호 확인</Text>
              <TextInput
                placeholder="비밀번호 확인"
                secureTextEntry={!showPasswordConfirm}
                value={passwordConfirm}
                rightIcon={
                  <Pressable onPress={() => setShowPasswordConfirm((v) => !v)} hitSlop={8}>
                    <VisibilityIcon width={24} height={24} className="text-gray-600" />
                  </Pressable>
                }
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
                className={errors.passwordConfirm ? 'border border-danger' : ''}
              />
              {errors.passwordConfirm ? (
                <Text className="text-danger px-1">{errors.passwordConfirm}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* 시안: 계속하기는 화면 하단 고정 */}
        <View className="px-4 pb-9">
          <Button
            label="계속하기"
            onClick={() => void handleSubmit()}
            loading={loading}
            disabled={!email || !password || !passwordConfirm}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
