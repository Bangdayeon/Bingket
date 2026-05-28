/* eslint-disable @typescript-eslint/no-require-imports */
const { withStringsXml, withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const META_APP_KEY = 'com.kakao.sdk.AppKey';
const KAKAO_TALK_PACKAGE = 'com.kakao.talk';

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

  return config;
};

module.exports = withKakaoShareLink;
