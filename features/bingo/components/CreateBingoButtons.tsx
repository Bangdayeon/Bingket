import { View } from 'react-native';
import Button from '@/components/Button';
import { CoachMarkTarget } from '@/features/coachmark/CoachMarkTarget';
import { useTranslation } from 'react-i18next';

export function CreateBingoButtons({
  onCreate,
  hasFriends,
}: {
  onCreate: (pathname: string) => void;
  hasFriends: boolean;
}) {
  const { t } = useTranslation();

  return (
    <View className="w-full max-w-[282px] gap-4 self-center">
      <CoachMarkTarget id="home-create-bingo" className="w-full">
        <Button
          label={hasFriends ? t('home.addBingo.myself') : t('home.addBingo.default')}
          size="md"
          onClick={() => onCreate('/bingo/add')}
          className="w-full"
        />
      </CoachMarkTarget>
      {hasFriends && (
        <Button
          label={t('home.addBingo.friends')}
          variant="secondary"
          size="md"
          onClick={() => onCreate('/bingo/team-mode')}
          className="w-full"
        />
      )}
    </View>
  );
}
