import CheckIcon from '@/assets/icons/ic_check.svg';
import ArrowForwardIcon from '@/assets/icons/ic_arrow_forward.svg';
import { useState } from 'react';
import { Linking, Modal, Pressable, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Text';
import Button from '@/components/Button';

const TERMS_URL = 'https://www.notion.so/32eadd99c0428005b2e0e2437d6cd91a'; // 이용 약관 Notion 링크
const PRIVACY_URL = 'https://www.notion.so/32eadd99c04280558920e3c684d4bd9a'; // 개인정보처리방침 Notion 링크

interface AgreementModalProps {
  visible: boolean;
  onAgree: () => Promise<void>;
  onDismiss: () => void;
}

export function AgreementModal({ visible, onAgree, onDismiss }: AgreementModalProps) {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [age, setAge] = useState(false);
  const [loading, setLoading] = useState(false);

  const allChecked = terms && privacy && age;

  const toggleAll = () => {
    const next = !allChecked;
    setTerms(next);
    setPrivacy(next);
    setAge(next);
  };

  const handleAgree = async () => {
    setLoading(true);
    try {
      await onAgree();
    } finally {
      setLoading(false);
      setTerms(false);
      setPrivacy(false);
      setAge(false);
    }
  };

  const handleDismiss = () => {
    setTerms(false);
    setPrivacy(false);
    setAge(false);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <Pressable className="flex-1 bg-scrim/40 justify-end" onPress={handleDismiss}>
        <Pressable className="bg-white   rounded-t-[24px] px-5 pt-6 pb-10">
          {/* Title */}
          <Text className="text-title-sm mb-6">서비스 이용 필수 동의</Text>

          {/* 전체 동의 */}
          <TouchableOpacity
            className="flex-row items-center gap-3 mb-4"
            onPress={toggleAll}
            activeOpacity={0.7}
          >
            <CheckCircle checked={allChecked} />
            <Text className="text-label-md flex-1">전체 동의</Text>
          </TouchableOpacity>

          {/* 구분선 */}
          <View className="h-px bg-gray-100   mb-4" />

          {/* 이용 약관 동의 */}
          <AgreementItem
            label="이용 약관 동의"
            checked={terms}
            onToggle={() => setTerms((v) => !v)}
            onLinkPress={() => void Linking.openURL(TERMS_URL)}
          />

          {/* 개인정보 수집 및 이용 동의 */}
          <AgreementItem
            label="개인정보 수집 및 이용 동의"
            checked={privacy}
            onToggle={() => setPrivacy((v) => !v)}
            onLinkPress={() => void Linking.openURL(PRIVACY_URL)}
          />

          {/* 만 14세 이상 */}
          <TouchableOpacity
            className="flex-row items-center gap-3 mb-6"
            onPress={() => setAge((v) => !v)}
            activeOpacity={0.7}
          >
            <CheckCircle checked={age} />
            <Text className="text-label-md flex-1">만 14세 이상입니다</Text>
          </TouchableOpacity>

          {/* 다음 버튼 */}
          <Button
            label="다음"
            onClick={() => void handleAgree()}
            disabled={!allChecked}
            loading={loading}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface AgreementItemProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  onLinkPress: () => void;
}

function AgreementItem({ label, checked, onToggle, onLinkPress }: AgreementItemProps) {
  return (
    <View className="flex-row items-center gap-3 mb-4">
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <CheckCircle checked={checked} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onLinkPress}
        activeOpacity={0.7}
        className="flex-1 flex-row justify-between items-center p-1"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text className="text-label-md">{label}</Text>
        <ArrowForwardIcon width={24} height={24} className="text-gray-800" />
      </TouchableOpacity>
    </View>
  );
}

interface CheckCircleProps {
  checked: boolean;
}

function CheckCircle({ checked }: CheckCircleProps) {
  return (
    <View
      className={`w-6 h-6 rounded-full items-center justify-center ${
        checked ? 'bg-green-400' : 'border-2 border-gray-300  '
      }`}
    >
      {checked && <CheckIcon width={16} height={16} className="text-on-brand-dark" />}
    </View>
  );
}
