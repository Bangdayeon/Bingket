import { render, screen, waitFor } from '@testing-library/react-native';
import { ForceUpdateGate } from '@/features/app-update/ForceUpdateGate';

const mockIsUpdateRequired = jest.fn();

jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));

jest.mock('@/features/app-update/lib/app-update', () => ({
  isUpdateRequired: () => mockIsUpdateRequired(),
  storeUrls: () => ({ primary: 'market://x', fallback: 'https://x' }),
}));

beforeEach(() => mockIsUpdateRequired.mockReset());

describe('ForceUpdateGate', () => {
  it('막아야 하면 안내와 버튼을 띄운다', async () => {
    mockIsUpdateRequired.mockResolvedValue(true);
    render(<ForceUpdateGate />);
    await waitFor(() => expect(screen.getByText('업데이트가 필요해요')).toBeTruthy());
    expect(screen.getByText('업데이트하러 가기')).toBeTruthy();
  });

  it('막을 필요가 없으면 아무것도 보이지 않는다', async () => {
    mockIsUpdateRequired.mockResolvedValue(false);
    render(<ForceUpdateGate />);
    await waitFor(() => expect(mockIsUpdateRequired).toHaveBeenCalled());
    expect(screen.queryByText('업데이트가 필요해요')).toBeNull();
  });

  it('검사가 터져도 화면을 가리지 않는다', async () => {
    mockIsUpdateRequired.mockRejectedValue(new Error('boom'));
    render(<ForceUpdateGate />);
    await waitFor(() => expect(mockIsUpdateRequired).toHaveBeenCalled());
    expect(screen.queryByText('업데이트가 필요해요')).toBeNull();
  });
});
