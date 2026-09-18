import { grantConsent, loadConsent, revokeConsent } from '@/lib/consent';

export async function hasAgreed(): Promise<boolean> {
  return loadConsent();
}

export async function saveAgreement(): Promise<void> {
  return grantConsent();
}

export async function resetAgreement(): Promise<void> {
  return revokeConsent();
}
