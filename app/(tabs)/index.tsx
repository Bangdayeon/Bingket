import { BingoAll } from '@/features/bingo/BingoAll';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="relative flex-1 bg-white" edges={['top']}>
      <BingoAll />
    </SafeAreaView>
  );
}
