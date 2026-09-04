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

/**
 * Firebase 설정 파일(GoogleService-Info.plist, google-services.json)은 커밋하지 않는다.
 * EAS 빌드에서는 file 타입 환경변수로 올려두면 빌드 서버가 임시 경로를 환경변수에 담아 주므로
 * 그 경로를 쓰고, 로컬(prebuild/run)에서는 app.json에 적힌 프로젝트 루트 경로를 그대로 쓴다.
 */
const iosGoogleServicesFile = process.env.GOOGLE_SERVICES_INFO_PLIST;
const androidGoogleServicesFile = process.env.GOOGLE_SERVICES_JSON;

export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-notifications') {
      const [name, props] = plugin as [string, Record<string, unknown>];
      return [name, { ...props, mode: isProductionBuild ? 'production' : 'development' }];
    }
    return plugin;
  });

  return {
    ...config,
    plugins,
    ios: {
      ...config.ios,
      ...(iosGoogleServicesFile ? { googleServicesFile: iosGoogleServicesFile } : {}),
    },
    android: {
      ...config.android,
      ...(androidGoogleServicesFile ? { googleServicesFile: androidGoogleServicesFile } : {}),
    },
  } as ExpoConfig;
};
