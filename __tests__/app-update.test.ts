/**
 * isUpdateRequired 의 fail open 이 이 테스트의 핵심이다.
 * 여기가 뒤집히면 서버가 잠깐 흔들릴 때 전 사용자의 앱이 잠긴다.
 */
import { isUpdateRequired } from '@/features/app-update/lib/app-update';

const mockMaybeSingle = jest.fn();

// jest 설정의 transformIgnorePatterns 에 없어서 원본을 그대로 읽으면 파싱에 실패한다
jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => mockMaybeSingle(),
        }),
      }),
    }),
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  get default() {
    return { expoConfig: mockExpoConfig };
  },
}));

let mockExpoConfig: { version?: string } | null = { version: '1.0.7' };

beforeEach(() => {
  mockExpoConfig = { version: '1.0.7' };
  mockMaybeSingle.mockReset();
});

const respond = (min: string) =>
  mockMaybeSingle.mockResolvedValue({ data: { min_version: min }, error: null });

describe('isUpdateRequired', () => {
  it('앱이 최소 버전보다 낮으면 막는다', async () => {
    respond('1.1.0');
    await expect(isUpdateRequired()).resolves.toBe(true);
  });

  it('최소 버전과 같으면 통과', async () => {
    respond('1.0.7');
    await expect(isUpdateRequired()).resolves.toBe(false);
  });

  it('최소 버전보다 높으면 통과', async () => {
    respond('1.0.0');
    await expect(isUpdateRequired()).resolves.toBe(false);
  });

  describe('fail open', () => {
    it('조회가 실패하면 막지 않는다', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'network' } });
      await expect(isUpdateRequired()).resolves.toBe(false);
    });

    it('행이 없으면 막지 않는다', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      await expect(isUpdateRequired()).resolves.toBe(false);
    });

    it('예외가 나도 막지 않는다', async () => {
      mockMaybeSingle.mockRejectedValue(new Error('boom'));
      await expect(isUpdateRequired()).resolves.toBe(false);
    });

    it('min_version 을 숫자로 읽을 수 없으면 막지 않는다', async () => {
      respond('알 수 없음');
      await expect(isUpdateRequired()).resolves.toBe(false);
    });

    it('앱 버전을 알 수 없으면 막지 않는다', async () => {
      mockExpoConfig = null;
      respond('99.0.0');
      await expect(isUpdateRequired()).resolves.toBe(false);
    });
  });
});
