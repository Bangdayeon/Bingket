import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { useTranslation } from 'react-i18next';
import { SubHeader } from '@/components/SubHeader';
import { Text } from '@/components/Text';
import { EmptyState } from '@/components/EmptyState';
import BingoPreview from '@/components/BingoPreview';
import { containsBadWord } from '@/constants/bad-words';
import { createPost, fetchMyBingosForPost } from '@/features/community/lib/community';
import type { BingoData } from '@/types/bingo';

export default function BingosWriteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [boards, setBoards] = useState<BingoData[]>([]);
  const [selected, setSelected] = useState<BingoData | null>(null);
  const [memo, setMemo] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [choosing, setChoosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    fetchMyBingosForPost()
      .then((items) => {
        const eligible = items.filter((item) => item.id !== 'draft');
        setBoards(eligible);
        setSelected(eligible[0] ?? null);
      })
      .catch(Sentry.captureException);
  }, []);
  const submit = async () => {
    if (!selected || !memo.trim() || submitting) return;
    if (containsBadWord(memo)) {
      Alert.alert(t('board.badWord'));
      return;
    }
    setSubmitting(true);
    try {
      await createPost({
        category: 'bingo_memo',
        title: selected.title,
        isAnonymous: anonymous,
        blocks: [
          { id: 'bingo', type: 'bingo', bingo: selected },
          { id: 'memo', type: 'text', value: memo.trim() },
        ],
      });
      router.back();
    } catch (error) {
      Sentry.captureException(error);
      Alert.alert(t('common.error.general'));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <SubHeader
        title={t('common.screen.bingos')}
        right={
          <Pressable disabled={!selected || !memo.trim() || submitting} onPress={submit}>
            <Text>{t('board.submit')}</Text>
          </Pressable>
        }
      />
      {boards.length === 0 ? (
        <EmptyState
          message={t('board.post.bingo.empty')}
          actionLabel={t('board.post.bingo.create')}
          onAction={() => router.push('/bingo/add')}
        />
      ) : (
        <ScrollView className="flex-1 px-5">
          <Pressable
            onPress={() => setChoosing(!choosing)}
            className="rounded-xl border border-gray-300 p-4"
          >
            <Text>{selected?.title ?? ''} ▾</Text>
          </Pressable>
          {choosing &&
            boards.map((board) => (
              <Pressable
                key={board.id}
                onPress={() => {
                  setSelected(board);
                  setChoosing(false);
                }}
                className="border-b border-gray-200 p-4"
              >
                <Text>{board.title}</Text>
              </Pressable>
            ))}
          {selected && (
            <View className="mt-5">
              <BingoPreview bingo={selected} size="md" />
            </View>
          )}
          <TextInput
            value={memo}
            onChangeText={setMemo}
            maxLength={20}
            multiline
            placeholder={t('board.post.form.contentPlaceholder')}
            className="mt-5 min-h-24 text-body-md text-gray-900"
          />
          <Text className="text-right text-gray-500">{memo.length}/20</Text>
          <Pressable onPress={() => setAnonymous(!anonymous)} className="mt-5">
            <Text>
              {t('board.anonymous')} {anonymous ? '✓' : ''}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
