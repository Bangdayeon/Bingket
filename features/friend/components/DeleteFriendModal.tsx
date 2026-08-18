import { Modal } from '@/components/Modal';
import type { Friend } from '@/types/friend';

interface Props {
  friend: Friend | null;
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
}

export function DeleteFriendModal({ friend, onConfirm, onDismiss }: Props) {
  return (
    <Modal
      visible={!!friend}
      title="친구 삭제"
      body={`${friend?.displayName ?? ''}님을 친구 목록에서 삭제할까요?`}
      variant="warning"
      confirmLabel="삭제"
      cancelLabel="취소"
      onConfirm={onConfirm}
      onCancel={onDismiss}
    />
  );
}
