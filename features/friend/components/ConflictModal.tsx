import { Modal } from '@/components/Modal';
import type { ConflictModal as ConflictModalType } from '@/types/friend';
import { useTranslation } from 'react-i18next';

interface Props {
  conflictModal: ConflictModalType | null; // 친구 요청이 있는지 여부
  handleConflictResponse: (accept: boolean) => void;
}

export function ConflictModal({ conflictModal, handleConflictResponse }: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={!!conflictModal}
      title={t('friends.requestModal.title')}
      body={t('friends.requestModal.body')}
      variant="warning"
      confirmLabel={t('notifications.action.confirm')}
      cancelLabel={t('notifications.action.deny')}
      onConfirm={() => handleConflictResponse(true)}
      onCancel={() => handleConflictResponse(false)}
    />
  );
}
