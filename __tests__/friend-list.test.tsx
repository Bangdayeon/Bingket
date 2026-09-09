jest.mock('@/assets/icons/ic_check.svg', () => 'CheckIcon');
jest.mock('@/assets/default_profiles/profile_lg.svg', () => 'ProfileLgSvg');
jest.mock('@/assets/icons/ic_arrow_forward.svg', () => 'ArrowForwardIcon');
import { useState } from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { CollapsibleSection } from '@/features/friend/components/CollapsibleSection';
import { FriendList } from '@/features/friend/components/FriendList';
import { SearchList } from '@/features/friend/components/SearchList';
import { Text } from '@/components/Text';

const noop = () => {};

function Harness() {
  const [open, setOpen] = useState(true);
  return (
    <CollapsibleSection title="친구" count={1} expanded={open} onToggle={() => setOpen((v) => !v)}>
      <Text>내용</Text>
    </CollapsibleSection>
  );
}

it('접기/펼치기가 동작한다', () => {
  render(<Harness />);
  expect(screen.getByText('내용')).toBeTruthy();
  fireEvent.press(screen.getByText('친구'));
  expect(screen.queryByText('내용')).toBeNull();
});

it('친구 목록 빈 상태 문구가 검색 여부에 따라 다르다', () => {
  const a = render(<FriendList friends={[]} handleDeleteFriend={noop} handleProfilePress={noop} />);
  expect(a.getByText('아직 친구가 없어요')).toBeTruthy();

  const b = render(
    <FriendList friends={[]} searching handleDeleteFriend={noop} handleProfilePress={noop} />,
  );
  expect(b.getByText('일치하는 친구가 없어요')).toBeTruthy();
});

it('전체 유저 목록은 이미 친구인 사람을 제외한다', () => {
  const results = [
    {
      id: '1',
      display_name: '친구야',
      username: 'a',
      avatar_url: null,
      is_friend: true,
      request_status: null,
    },
    {
      id: '2',
      display_name: '남남이',
      username: 'b',
      avatar_url: null,
      is_friend: false,
      request_status: null,
    },
  ];
  render(
    <SearchList
      searchLoading={false}
      searchError={null}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      searchResults={results as any}
      sending={null}
      handleRequest={noop}
      handleProfilePress={noop}
    />,
  );
  expect(screen.queryByText('친구야')).toBeNull();
  expect(screen.getByText('남남이')).toBeTruthy();
});

it('고르기 모드에서는 삭제 대신 선택 표시가 나온다', () => {
  const friends = [
    {
      friendId: 'f1',
      username: 'aa',
      displayName: '친구1',
      avatarUrl: null,
    },
  ];
  const a = render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <FriendList friends={friends as any} handleDeleteFriend={noop} handleProfilePress={noop} />,
  );
  expect(a.getByText('삭제')).toBeTruthy();

  const b = render(
    <FriendList
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      friends={friends as any}
      selectable
      selectedIds={['f1']}
      handleDeleteFriend={noop}
      handleProfilePress={noop}
    />,
  );
  expect(b.queryByText('삭제')).toBeNull();
});
