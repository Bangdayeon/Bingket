import { Modal } from '@/components/Modal';
import type { ConflictModal as ConflictModalType } from '@/types/friend';

interface Props {
  conflictModal: ConflictModalType | null; // 친구 요청이 있는지 여부
  handleConflictResponse: (accept: boolean) => void;
}

export function ConflictModal({ conflictModal, handleConflictResponse }: Props) {
  return (
    <Modal
      visible={!!conflictModal}
      title="친구 요청"
      body="상대방이 보낸 친구 요청이 있어요.\n수락할까요?"
      variant="warning"
      confirmLabel="수락"
      cancelLabel="거절"
      onConfirm={() => handleConflictResponse(true)}
      onCancel={() => handleConflictResponse(false)}
    />
  );
}
