import { Modal } from '@/components/Modal';
import { useTranslation } from 'react-i18next';

interface Props {
  message: string | null;
  onDismiss: () => void;
}

export function ErrorModal({ message, onDismiss }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={!!message}
      title={t('common.error.general')}
      body={message ?? ''}
      variant="single"
      confirmLabel={t('common.confirm')}
      onConfirm={onDismiss}
      onDismiss={onDismiss}
    />
  );
}
