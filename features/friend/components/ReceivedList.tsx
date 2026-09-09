import { View, Text, Pressable } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { IncomingRequest as IncomingRequestType } from '@/types/friend';

interface Props {
  pendingRequests: IncomingRequestType[];
  handleIncomingResponse: (requestId: string, accept: boolean) => void;
}

export function ReceivedList({ pendingRequests, handleIncomingResponse }: Props) {
  return (
    <View>
      {pendingRequests.length > 0 && (
        <View>
          <Text className="text-title-sm   px-4 pt-4 pb-2">
            받은 친구 요청 {pendingRequests.length}
          </Text>
          {pendingRequests.map((req) => (
            <View
              key={req.id}
              className="flex-row items-center px-4 py-3 border-b border-gray-100  "
            >
              <ProfileAvatar avatarUrl={req.avatarUrl} size={40} />
              <View className="flex-1 ml-3">
                <Text className="text-title-sm">{req.displayName}</Text>
                <Text className="text-caption-sm text-gray-500  ">@{req.username}</Text>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => handleIncomingResponse(req.id, false)}
                  className="px-4 py-2 rounded-full bg-danger"
                >
                  <Text className="text-label-sm text-on-danger">거절</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleIncomingResponse(req.id, true)}
                  className="px-4 py-2 rounded-full bg-green-400"
                >
                  <Text className="text-label-sm text-on-brand-dark">수락</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
