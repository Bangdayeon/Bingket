import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.json이 여전히 설정의 단일 출처다.
 * 이 파일은 빌드 프로파일에 따라 달라져야 하는 값만 주입한다.
 *
 * expo-notifications 플러그인의 `mode`는 iOS entitlements의 `aps-environment` 값이 되고,
 * 기본값이 'development'다. 그대로 TestFlight/App Store 빌드를 올리면 앱이 APNs **sandbox**
 * 토큰을 받는데, Expo 푸시 서비스는 production APNs로 전송하므로 BadDeviceToken으로 전부 실패한다.
 * (예전 코드는 전송 결과를 버려서 이 실패가 전혀 드러나지 않았다)
 */
const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';

export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-notifications') {
      const [name, props] = plugin as [string, Record<string, unknown>];
      return [name, { ...props, mode: isProductionBuild ? 'production' : 'development' }];
    }
    return plugin;
  });

  return { ...config, plugins } as ExpoConfig;
};
