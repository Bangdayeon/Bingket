import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import { SettingsMenu } from '@/features/mypage/SettingsMenu';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* 화면 제목은 SettingsMenu 안에서 본문 헤딩으로 그린다 */}
      <View className="h-[60px] flex-row items-center px-4">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
      </View>

      <SettingsMenu />
    </View>
  );
}
