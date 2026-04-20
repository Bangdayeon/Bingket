import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import DoneIcon from '@/assets/icons/ic_done.svg';
import DraftIcon from '@/assets/icons/ic_draft.svg';
import ProgressIcon from '@/assets/icons/ic_progress.svg';
import ForwardArrowIcon from '@/assets/icons/ic_arrow_forward.svg';
import { fetchMyBingos, fetchMyCompletedBingos } from '@/features/bingo/lib/bingo';
import { applyBingoOrder, loadBingoOrder, saveBingoOrder } from '@/features/bingo/lib/bingo-order';
import { getCache, setCache } from '@/lib/cache';
import { CACHE_KEY_HISTORY } from '@/constants/cache_key';
import Loading from '@/components/Loading';

interface HistoryCache {
  drafts: BingoItem[];
  inProgress: BingoItem[];
  done: BingoItem[];
}

interface BingoItem {
  id: string;
  title: string;
}

function Section({
  icon,
  label,
  items,
  onItemPress,
}: {
  icon: React.ReactNode;
  label: string;
  items: BingoItem[];
  onItemPress: (item: BingoItem) => void;
}) {
  const iconColor = '#181C1C'; /* gray-100 : gray-900 */

  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 py-3">
        {icon}
        <Text className="text-title-md font-pretendard-medium">{label}</Text>
      </View>
      {items.length === 0 && <Text className="text-body-sm text-gray-400   py-2">없음</Text>}
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onItemPress(item)}
          className="flex-row items-center justify-between py-3"
        >
          <Text className="text-title-sm">{item.title}</Text>
          <ForwardArrowIcon width={20} height={20} color={iconColor} />
        </Pressable>
      ))}
    </View>
  );
}

// 아이템 행 높이 (py-3 * 2 + 텍스트 높이 근사값)
const ITEM_HEIGHT = 44;

function DraggableInProgressSection({
  icon,
  label,
  items,
  isReorderMode,
  onItemPress,
  onOrderChange,
}: {
  icon: React.ReactNode;
  label: string;
  items: BingoItem[];
  isReorderMode: boolean;
  onItemPress: (item: BingoItem) => void;
  onOrderChange: (items: BingoItem[]) => void;
}) {
  const iconColor = '#181C1C'; /* gray-100 : gray-900 */

  const [orderedItems, setOrderedItems] = useState(items);
  const orderedItemsRef = useRef(items);
  const isDraggingRef = useRef(false);

  // items prop 변경 시 동기화 (드래그 중에는 무시)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setOrderedItems(items);
      orderedItemsRef.current = items;
    }
  }, [items]);

  const startIndexRef = useRef<number | null>(null);
  const activeIndexRef = useRef<number | null>(null);
  const baseOffsetRef = useRef(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  // 아이템 ID → 현재 시각적 인덱스 (매 렌더마다 업데이트)
  const itemIndexRef = useRef<Map<string, number>>(new Map());
  orderedItems.forEach((item, i) => itemIndexRef.current.set(item.id, i));

  // PanResponder 콜백을 ref로 관리 (stale closure 방지)
  const onMoveRef = useRef<(dy: number) => void>(() => {});
  const onReleaseRef = useRef(() => {});

  onMoveRef.current = (dy: number) => {
    if (startIndexRef.current === null || activeIndexRef.current === null) return;
    const adjustedDy = dy - baseOffsetRef.current;
    translateY.setValue(adjustedDy);

    const n = orderedItemsRef.current.length;
    const targetRaw = startIndexRef.current + dy / ITEM_HEIGHT;
    const target = Math.max(0, Math.min(n - 1, Math.round(targetRaw)));
    const from = activeIndexRef.current;

    if (target !== from) {
      const newItems = [...orderedItemsRef.current];
      const [removed] = newItems.splice(from, 1);
      newItems.splice(target, 0, removed);
      orderedItemsRef.current = newItems;
      activeIndexRef.current = target;
      baseOffsetRef.current += (target - from) * ITEM_HEIGHT;
      setOrderedItems([...newItems]);
    }
  };

  onReleaseRef.current = () => {
    isDraggingRef.current = false;
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start(() =>
      setDraggingId(null),
    );
    startIndexRef.current = null;
    activeIndexRef.current = null;
    baseOffsetRef.current = 0;
    onOrderChange(orderedItemsRef.current);
  };

  // 아이템 ID별 PanResponder (한 번만 생성)
  const panRespondersRef = useRef<Map<string, ReturnType<typeof PanResponder.create>>>(new Map());

  function getOrCreatePanResponder(itemId: string) {
    if (!panRespondersRef.current.has(itemId)) {
      panRespondersRef.current.set(
        itemId,
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            const idx = itemIndexRef.current.get(itemId) ?? 0;
            isDraggingRef.current = true;
            startIndexRef.current = idx;
            activeIndexRef.current = idx;
            baseOffsetRef.current = 0;
            translateY.setValue(0);
            setDraggingId(itemId);
          },
          onPanResponderMove: (_, { dy }) => onMoveRef.current(dy),
          onPanResponderRelease: () => onReleaseRef.current(),
          onPanResponderTerminate: () => onReleaseRef.current(),
        }),
      );
    }
    return panRespondersRef.current.get(itemId)!;
  }

  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 py-3">
        {icon}
        <Text className="text-title-md">{label}</Text>
      </View>
      {orderedItems.length === 0 && <Text className="text-body-sm text-gray-400   py-2">없음</Text>}
      {orderedItems.map((item) => {
        const isDragging = draggingId === item.id;
        const panResponder = getOrCreatePanResponder(item.id);
        return (
          <Animated.View
            key={item.id}
            style={
              isDragging
                ? {
                    transform: [{ translateY }],
                    zIndex: 10,
                    backgroundColor: '#FDFDFD' /* white */,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.12,
                    shadowRadius: 5,
                    elevation: 5,
                  }
                : undefined
            }
          >
            <Pressable
              onPress={() => !isReorderMode && onItemPress(item)}
              className="flex-row items-center justify-between py-3"
            >
              <Text className="text-title-sm flex-1 mr-2">{item.title}</Text>
              {isReorderMode ? (
                // 드래그 핸들
                <View
                  {...panResponder.panHandlers}
                  className="p-2 justify-center items-center gap-[4px]"
                >
                  <View className="w-5 h-[2px] rounded-full bg-gray-400" />
                  <View className="w-5 h-[2px] rounded-full bg-gray-400" />
                  <View className="w-5 h-[2px] rounded-full bg-gray-400" />
                </View>
              ) : (
                <ForwardArrowIcon width={20} height={20} color={iconColor} />
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

export function BingoHistory({ isReorderMode }: { isReorderMode: boolean }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<BingoItem[]>([]);
  const [inProgress, setInProgress] = useState<BingoItem[]>([]);
  const [done, setDone] = useState<BingoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isNavigatingRef = useRef(false);

  const navigate = useCallback((fn: () => void) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    fn();
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  }, []);

  const loadData = useCallback(() => {
    Promise.all([
      AsyncStorage.getItem('@bingket/draft-bingo'),
      fetchMyBingos(),
      fetchMyCompletedBingos(),
      loadBingoOrder(),
    ]).then(([raw, progress, completed, savedOrder]) => {
      const draft = raw ? JSON.parse(raw) : null;
      const drafts = draft?.title ? [{ id: 'draft_0', title: draft.title }] : [];
      const progressItems = progress.map(({ bingo }) => ({ id: bingo.id, title: bingo.title }));
      const inProgress = applyBingoOrder(progressItems, savedOrder);
      const done = completed.map(({ bingo }) => ({ id: bingo.id, title: bingo.title }));
      setDrafts(drafts);
      setInProgress(inProgress);
      setDone(done);
      setLoading(false);
      setCache(CACHE_KEY_HISTORY, { drafts, inProgress, done });
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getCache<HistoryCache>(CACHE_KEY_HISTORY).then((cached) => {
        if (cached) {
          setDrafts(cached.drafts);
          setInProgress(cached.inProgress);
          setDone(cached.done);
          setLoading(false);
        }
        loadData();
      });
    }, [loadData]),
  );

  const handleOrderChange = useCallback((newItems: BingoItem[]) => {
    setInProgress(newItems);
    saveBingoOrder(newItems.map((item) => item.id)).catch(Sentry.captureException);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 mt-[80px] items-center justify-center bg-white  ">
        <Loading color="#6ADE50" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 mt-[70px] bg-white px-5   mb-20" scrollEnabled={!isReorderMode}>
      <Section
        icon={<DraftIcon />}
        label="제작 중"
        items={drafts}
        onItemPress={() =>
          navigate(() => router.push({ pathname: '/bingo/add', params: { loadDraft: 'true' } }))
        }
      />
      <DraggableInProgressSection
        icon={<ProgressIcon />}
        label="진행 중"
        items={inProgress}
        isReorderMode={isReorderMode}
        onItemPress={(item) =>
          navigate(() => router.push({ pathname: '/bingo/view', params: { bingoId: item.id } }))
        }
        onOrderChange={handleOrderChange}
      />
      <Section
        icon={<DoneIcon color="#48BE30" /* green-600 */ />}
        label="완료"
        items={done}
        onItemPress={(item) =>
          navigate(() => router.push({ pathname: '/bingo/view', params: { bingoId: item.id } }))
        }
      />
    </ScrollView>
  );
}
