import { Modal } from '@/components/Modal';

import type { Friend } from '@/types/friend';

import { useTranslation } from 'react-i18next';

interface Props {
  friend: Friend | null;
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
}

export function DeleteFriendModal({ friend, onConfirm, onDismiss }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={!!friend}
      title={t('friends.delete')}
      body={t('friends.deleteConfirm', {
        displayName: friend?.displayName ?? '',
      })}
      variant="warning"
      confirmLabel={t('common.delete')}
      cancelLabel={t('common.cancel')}
      onConfirm={onConfirm}
      onCancel={onDismiss}
    />
  );
}
