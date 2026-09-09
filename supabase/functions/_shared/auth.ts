/**
 * notify-* 함수의 호출자 인증.
 *
 * **왜 전용 키를 쓰는가.**
 * 예전에는 `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` 와 문자열 비교를 했다.
 * 그런데 2026-08-30 확인 결과 이 프로젝트의 런타임에 주입된 값이 Management API 가
 * 돌려주는 service_role 키와 **일치하지 않아서**, 올바른 키로 호출해도 전부 401 이었다.
 * 호출자가 DB 트리거라 그 401 은 아무 데도 드러나지 않는다 -- 알림이 조용히 사라진다.
 *
 * 그래서 플랫폼이 주입하는 이름에 기대지 않고 우리가 발급한 키를 쓴다.
 *   supabase secrets set PUSH_DISPATCH_KEY=<임의값>
 * 같은 값을 DB Vault 에도 넣어 pg_net 트리거가 Bearer 로 싣는다
 * (public.set_push_config).
 *
 * 엣지 함수 게이트웨이는 verify_jwt=false 라 Authorization 헤더를 검사하지 않고
 * 그대로 함수까지 흘려보낸다. 즉 **이 함수가 유일한 인증 경계다.**
 */
const DISPATCH_ENV = 'PUSH_DISPATCH_KEY';

/** 하위 호환. 플랫폼 주입 키가 맞는 프로젝트에서는 이쪽으로도 통과시킨다 */
const FALLBACK_ENV = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY'] as const;

const nonEmpty = (name: string): string | null => {
  const value = Deno.env.get(name);
  return value && value.length > 0 ? value : null;
};

/** supabase 클라이언트 생성용. DB 접근에는 플랫폼이 주는 service_role 키가 필요하다 */
export const serviceKey = (): string =>
  FALLBACK_ENV.map((name) => nonEmpty(name)).find((v): v is string => v !== null) ?? '';

/** 길이가 달라도 조기 반환하지 않는다 (타이밍 공격 방어) */
const timingSafeEqual = (a: string, b: string): boolean => {
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
};

/**
 * 인증에 실패하면 Response 를, 통과하면 null 을 돌려준다.
 *
 * ```ts
 * const denied = verifyServiceRole(req);
 * if (denied) return denied;
 * ```
 *
 * 실패 사유를 본문에 구분해 싣는다. 값은 절대 싣지 않는다 --
 * 예전처럼 무조건 "Unauthorized" 만 돌려주면 키가 틀린 건지 설정이 빈 건지 알 수 없다.
 */
export function verifyServiceRole(req: Request): Response | null {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token) {
    return new Response('Unauthorized (missing bearer token)', { status: 401 });
  }

  const accepted = [nonEmpty(DISPATCH_ENV), ...FALLBACK_ENV.map((n) => nonEmpty(n))].filter(
    (v): v is string => v !== null,
  );

  if (accepted.length === 0) {
    console.error(`[push] ${DISPATCH_ENV} 가 설정돼 있지 않다. supabase secrets set 으로 넣을 것`);
    return new Response('Unauthorized (no dispatch key configured)', { status: 401 });
  }

  if (!accepted.some((secret) => timingSafeEqual(secret, token))) {
    console.error(
      `[push] 호출자 키 불일치. ${DISPATCH_ENV} 설정 여부: ${!!nonEmpty(DISPATCH_ENV)}`,
    );
    return new Response('Unauthorized (key mismatch)', { status: 401 });
  }

  return null;
}
