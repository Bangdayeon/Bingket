import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { TextInput as RNTextInput, TouchableOpacity } from 'react-native';
import { AddEachBingo } from '@/features/bingo/bingo-edit/AddEachBingo';
import { PortalHost } from '@/components/PortalHost';
import i18n from '@/i18n';

jest.mock('@/features/bingo/lib/theme', () => ({
  FIGMA_W: 390,
  FIGMA_H: 390,
  GRID_CONFIGS: {
    '3x3': { top: 0, left: 0, cellW: 100, cellH: 100, gapX: 0, gapY: 0 },
  },
  getThemeImageUrl: () => Promise.resolve(null),
  getThemeForegroundColor: () => Promise.resolve('#000'),
}));

it('keeps the cell input uncontrolled while typing and saves the final text', async () => {
  i18n.changeLanguage('ko');
  const onCellsChange = jest.fn();
  const onDraftCellsChange = jest.fn();
  render(
    <>
      <AddEachBingo
        selectedGrid="3x3"
        theme="default"
        cells={['기존', ...Array(8).fill('')]}
        onCellsChange={onCellsChange}
        onDraftCellsChange={onDraftCellsChange}
      />
      <PortalHost />
    </>,
  );
  await act(async () => {});

  fireEvent.press(screen.UNSAFE_getAllByType(TouchableOpacity)[0]);
  const input = screen.UNSAFE_getByType(RNTextInput);
  expect(input.props.value).toBeUndefined();
  expect(input.props.defaultValue).toBe('기존');

  fireEvent.changeText(input, '기');
  fireEvent.changeText(input, '기록');
  expect(onDraftCellsChange).not.toHaveBeenCalled();
  expect(onCellsChange).not.toHaveBeenCalled();
  expect(screen.UNSAFE_getByType(RNTextInput).props.value).toBeUndefined();

  fireEvent.press(screen.getByText('저장하기'));
  expect(onCellsChange).toHaveBeenCalledWith(['기록', ...Array(8).fill('')]);

  fireEvent.press(screen.UNSAFE_getAllByType(TouchableOpacity)[0]);
  expect(screen.UNSAFE_getByType(RNTextInput).props.defaultValue).toBe('기록');

  fireEvent.changeText(screen.UNSAFE_getByType(RNTextInput), '임시');
  fireEvent.press(screen.getByText('취소'));
  fireEvent.press(screen.UNSAFE_getAllByType(TouchableOpacity)[0]);
  expect(screen.UNSAFE_getByType(RNTextInput).props.defaultValue).toBe('기록');
  expect(onCellsChange).toHaveBeenCalledTimes(1);
});
