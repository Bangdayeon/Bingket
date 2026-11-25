import { BingoAll } from '@/features/bingo/BingoAll';
import { MainHeader } from '@/components/MainHeader';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="relative flex-1 bg-white" edges={['top']}>
      <MainHeader title={t('common.screen.home')} />
      <BingoAll />
    </SafeAreaView>
  );
}
