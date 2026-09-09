import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { Modal } from '@/components/Modal';
import { PortalHost } from '@/components/PortalHost';

/**
 * 모달을 닫자마자 빠르게 탭하면 첫 터치가 먹히던 버그를 막는 테스트다.
 * 네이티브 Modal은 사라지는 동안 터치를 아래로 흘려보낼 수 없어서 오버레이로 바꿨고,
 * 여기서는 "닫기 시작하는 즉시 pointerEvents가 none이 되는지"를 본다.
 */
function Harness({ visible }: { visible: boolean }) {
  return (
    <>
      <Modal visible={visible} title="빙고 내용을 입력해주세요" onConfirm={() => {}} />
      <PortalHost />
    </>
  );
}

function overlay() {
  return screen.UNSAFE_getByProps({ pointerEvents: 'auto' });
}

it('열기 전에는 아무것도 그리지 않는다', () => {
  render(<Harness visible={false} />);
  expect(screen.queryByText('빙고 내용을 입력해주세요')).toBeNull();
});

it('visible이면 PortalHost를 통해 내용이 보이고 터치를 받는다', () => {
  render(<Harness visible />);
  expect(screen.getByText('빙고 내용을 입력해주세요')).toBeTruthy();
  expect(overlay()).toBeTruthy();
});

it('닫기 시작하면 사라지기 전에 먼저 터치를 통과시킨다', () => {
  jest.useFakeTimers();
  const view = render(<Harness visible />);

  act(() => {
    view.rerender(<Harness visible={false} />);
  });

  // 아직 페이드아웃 중이라 화면에는 남아 있지만
  expect(screen.getByText('빙고 내용을 입력해주세요')).toBeTruthy();
  // 터치는 이미 아래로 흘러가야 한다 (이게 먹히던 터치의 정체다)
  expect(screen.UNSAFE_queryByProps({ pointerEvents: 'auto' })).toBeNull();
  expect(screen.UNSAFE_getByProps({ pointerEvents: 'none' })).toBeTruthy();

  // 애니메이션이 끝나면 트리에서 내려간다
  act(() => {
    jest.advanceTimersByTime(500);
  });
  expect(screen.queryByText('빙고 내용을 입력해주세요')).toBeNull();

  jest.useRealTimers();
});

it('확인 버튼이 onConfirm을 부른다', () => {
  const onConfirm = jest.fn();
  render(
    <>
      <Modal visible title="제목" confirmLabel="저장하기" onConfirm={onConfirm} />
      <PortalHost />
    </>,
  );
  fireEvent.press(screen.getByText('저장하기'));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

it('여러 모달이 순서대로 쌓인다', () => {
  render(
    <>
      <Modal visible title="첫번째" onConfirm={() => {}} />
      <Modal visible title="두번째" onConfirm={() => {}} />
      <PortalHost />
    </>,
  );
  expect(screen.getByText('첫번째')).toBeTruthy();
  expect(screen.getByText('두번째')).toBeTruthy();
});
