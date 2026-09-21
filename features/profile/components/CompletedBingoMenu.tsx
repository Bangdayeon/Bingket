import { useRef, useState } from 'react';
import { Modal as NativeModal, Pressable, View, useWindowDimensions } from 'react-native';
import MoreIcon from '@/assets/icons/ic_more_horiz.svg';
import { Text } from '@/components/Text';
import { Modal } from '@/components/Modal';
import { deleteBingo } from '@/features/bingo/lib/bingo';
import { updateBoardVisibility, type BoardVisibility, type FeedItem } from '../lib/profile';
import { useTranslation } from 'react-i18next';

const OPTIONS = [
  { value: 'public', label: 'common.visibility.public' },
  { value: 'friends', label: 'common.visibility.friends' },
  { value: 'private', label: 'common.visibility.private' },
] as const satisfies readonly { value: BoardVisibility; label: string }[];

export function CompletedBingoMenu({ item, onChanged }: { item: FeedItem; onChanged: () => void }) {
  const { t } = useTranslation();
  const anchor = useRef<View>(null);
  const { height } = useWindowDimensions();
  const [top, setTop] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutate = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setTop(null);
    setConfirmDelete(false);
    try {
      await action();
      onChanged();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : `${t('common.error.network')} ${t('common.error.retry')}`,
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Pressable
        ref={anchor}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} ${t('common.more')}`}
        disabled={busy}
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation();
          anchor.current?.measureInWindow((_x, y, _w, h) =>
            setTop(Math.max(16, Math.min(y + h, height - 260))),
          );
        }}
      >
        <MoreIcon width={24} height={24} className="text-gray-900" />
      </Pressable>
      <NativeModal
        visible={top !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTop(null)}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setTop(null)}
          accessibilityLabel={t('settings.closeMenu')}
        />
        <View
          className="absolute right-4 rounded-2xl bg-surface p-4 border border-gray-300"
          style={{ top: top ?? 0, width: 200 }}
        >
          <Pressable
            onPress={() => {
              setTop(null);
              setConfirmDelete(true);
            }}
            className="py-2 mb-2 border-b border-gray-300"
          >
            <Text className="text-body-md text-danger">{t('board.post.delete.menu')}</Text>
          </Pressable>
          <Text className="text-caption-sm text-gray-500 mb-2">{t('common.visibility.label')}</Text>
          {OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: item.visibility === option.value }}
              onPress={() => void mutate(() => updateBoardVisibility(item.id, option.value))}
              className="flex-row items-center gap-3 py-2"
            >
              <View className="w-5 h-5 rounded-full border border-gray-500 items-center justify-center">
                {item.visibility === option.value && (
                  <View className="w-3 h-3 rounded-full bg-green-500" />
                )}
              </View>
              <Text className="text-body-md text-gray-900">{t(option.label)}</Text>
            </Pressable>
          ))}
        </View>
      </NativeModal>
      <Modal
        visible={confirmDelete}
        title={t('home.deleteConfirm')}
        body={item.title}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('board.post.delete.menu')}
        onCancel={() => setConfirmDelete(false)}
        onDismiss={() => setConfirmDelete(false)}
        onConfirm={() => void mutate(() => deleteBingo(item.id))}
      />
      <Modal
        visible={error !== null}
        title={t('common.editFail')}
        body={error ?? ''}
        confirmLabel={t('common.confirm')}
        onConfirm={() => setError(null)}
        onDismiss={() => setError(null)}
      />
    </>
  );
}
