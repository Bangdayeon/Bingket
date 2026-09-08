import { grantConsent, loadConsent, revokeConsent } from '@/lib/consent';

/**
 * 약관 동의 상태는 텔레메트리 수집 여부까지 좌우하므로 저장소 접근은 lib/consent.ts가
 * 단독으로 소유한다. 여기서는 인증 흐름이 쓰던 이름을 그대로 유지하며 위임만 한다.
 */
export async function hasAgreed(): Promise<boolean> {
  return loadConsent();
}

export async function saveAgreement(): Promise<void> {
  return grantConsent();
}

export async function resetAgreement(): Promise<void> {
  return revokeConsent();
}
