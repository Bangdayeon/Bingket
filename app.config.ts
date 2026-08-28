import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.json이 여전히 설정의 단일 출처다.
 * 이 파일은 빌드 프로파일에 따라 달라져야 하는 값만 주입한다.
 *
 * expo-notifications 플러그인의 `mode`는 iOS entitlements의 `aps-environment` 값이 되고,
 * 기본값이 'development'다. sandbox 토큰을 받으면 Expo 푸시 서비스가 production APNs로
 * 보내므로 BadDeviceToken으로 전부 실패한다.
 *
 * ⚠️ 이 파일이 실제로 효과를 내는 경로는 좁다. 오해하기 쉬우니 적어둔다.
 *
 * 1. `EAS_BUILD_PROFILE`은 EAS 빌드 워커에서만 설정된다. 로컬 prebuild에서는 항상
 *    undefined 이므로 `APS_ENV=production` 을 직접 넘겨야 한다.
 * 2. 그것마저도 `ios/app/app.entitlements` 에 이미 aps-environment 값이 있으면 무시된다.
 *    플러그인이 `if (!config.modResults['aps-environment'])` 로 가드하기 때문이다.
 *    (node_modules/expo-notifications/plugin/build/withNotificationsIOS.js)
 *    즉 기존 ios/ 폴더가 있으면 `expo prebuild --clean` 이라야 값이 바뀐다.
 * 3. **Xcode 로 아카이브 → Organizer 에서 App Store 배포**하는 경우에는 이 값이 무의미하다.
 *    Xcode 가 App Store 배포 프로파일로 재서명하면서 entitlements 를 그 프로파일 것으로
 *    교체하고, 배포 프로파일의 aps-environment 는 production 이기 때문이다.
 *    (실제로 2026-05-29 아카이브는 개발 프로파일로 빌드됐지만 정상 업로드됐다)
 */
const isProductionBuild =
  process.env.EAS_BUILD_PROFILE === 'production' || process.env.APS_ENV === 'production';

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
