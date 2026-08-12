/* eslint-disable @typescript-eslint/no-require-imports */
const {
  withStringsXml,
  withAndroidManifest,
  withInfoPlist,
  AndroidConfig,
} = require('@expo/config-plugins');

const META_APP_KEY = 'com.kakao.sdk.AppKey';
const KAKAO_TALK_PACKAGE = 'com.kakao.talk';
// 카카오톡 설치 여부 확인(ShareApi.isKakaoTalkSharingAvailable)에 필요한 iOS 조회 스킴
const KAKAO_QUERY_SCHEMES = ['kakaokompassauth', 'kakaolink', 'kakaoplus'];

function upsertStringItem(modResults, name, value) {
  const items = (modResults.resources.string ||= []);
  const existing = items.find((item) => item.$ && item.$.name === name);
  if (existing) {
    existing._ = value;
    existing.$.translatable = 'false';
  } else {
    items.push({ $: { name, translatable: 'false' }, _: value });
  }
  return modResults;
}

function upsertMetaData(application, name, value) {
  const metaData = (application['meta-data'] ||= []);
  const existing = metaData.find((m) => m.$ && m.$['android:name'] === name);
  if (existing) {
    existing.$['android:value'] = value;
  } else {
    metaData.push({ $: { 'android:name': name, 'android:value': value } });
  }
}

function upsertKakaoTalkQuery(manifest) {
  manifest.queries ||= [];
  if (manifest.queries.length === 0) manifest.queries.push({});
  const queries = manifest.queries[0];
  queries.package ||= [];
  const already = queries.package.some((p) => p.$ && p.$['android:name'] === KAKAO_TALK_PACKAGE);
  if (!already) {
    queries.package.push({ $: { 'android:name': KAKAO_TALK_PACKAGE } });
  }
}

const withKakaoShareLink = (config, props) => {
  const kakaoAppKey = props && props.kakaoAppKey;
  if (!kakaoAppKey) {
    throw new Error(
      '[withKakaoShareLink] `kakaoAppKey` 옵션이 필요합니다. app.json plugins 항목에서 전달하세요.',
    );
  }

  config = withStringsXml(config, (cfg) => {
    cfg.modResults = upsertStringItem(cfg.modResults, 'kakao_app_key', kakaoAppKey);
    return cfg;
  });

  config = withAndroidManifest(config, (cfg) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    upsertMetaData(application, META_APP_KEY, kakaoAppKey);
    upsertKakaoTalkQuery(cfg.modResults.manifest);
    return cfg;
  });

  // iOS 네이티브 모듈(KakaoShareLink.swift)은 init에서 Info.plist의 KAKAO_APP_KEY를
  // 강제 언래핑하므로, 값이 없으면 모듈 생성 시점에 앱이 크래시한다.
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.KAKAO_APP_KEY = kakaoAppKey;

    const schemes = (cfg.modResults.LSApplicationQueriesSchemes ||= []);
    for (const scheme of KAKAO_QUERY_SCHEMES) {
      if (!schemes.includes(scheme)) schemes.push(scheme);
    }
    return cfg;
  });

  return config;
};

module.exports = withKakaoShareLink;
