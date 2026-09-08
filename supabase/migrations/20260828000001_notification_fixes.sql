-- 알림 파이프라인 로직 버그 수정
--   1. 대댓글 알림이 "부모 댓글 작성자" 가 아니라 항상 "글쓴이" 에게 가던 문제
--   2. 인기글 알림이 좋아요 취소 → 재좋아요로 10을 다시 밟을 때마다 반복 발송되던 문제


-- ============================================================
-- 1. 인기글 알림 중복 정리 + 재발 방지 인덱스
-- ============================================================
-- 기존에 쌓인 중복 행은 가장 먼저 생긴 1건만 남긴다.
DELETE FROM public.notifications a
USING public.notifications b
WHERE a.type = 'popular'
  AND b.type = 'popular'
  AND a.user_id = b.user_id
  AND a.target_id IS NOT DISTINCT FROM b.target_id
  AND (a.created_at, a.id) > (b.created_at, b.id);

-- 게시글당 인기글 알림은 평생 1회. 트리거의 ON CONFLICT DO NOTHING 이 이 인덱스에 걸린다.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_notifications_popular
  ON public.notifications (user_id, target_id)
  WHERE type = 'popular';

-- ============================================================
-- 2. 댓글/대댓글 알림 트리거
-- ============================================================
-- 예전 구현은 v_notify_user_id 를 무조건 글쓴이로 잡고 NEW.parent_id 는 라벨(reply/comment)을
-- 고르는 데에만 썼다. 그래서 "A의 글 → B의 댓글 → C의 답글" 에서 알림이 A에게 가고
-- 정작 답글 대상인 B는 아무것도 받지 못했다.
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_post_author_id UUID;
  v_notify_user_id UUID;
  v_author_name    TEXT;
  v_notif_type     TEXT;
BEGIN
  IF NEW.is_deleted THEN RETURN NEW; END IF;

  SELECT user_id INTO v_post_author_id FROM public.posts WHERE id = NEW.post_id;
  IF v_post_author_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.parent_id IS NULL THEN
    v_notify_user_id := v_post_author_id;
    v_notif_type     := 'comment';
  ELSE
    -- 대댓글은 부모 댓글 작성자에게 간다.
    -- 부모 댓글이 이미 하드 삭제돼 작성자를 못 찾으면 글쓴이로 폴백한다.
    SELECT user_id INTO v_notify_user_id FROM public.comments WHERE id = NEW.parent_id;
    v_notify_user_id := COALESCE(v_notify_user_id, v_post_author_id);
    v_notif_type     := 'reply';
  END IF;

  -- 자기 글/자기 댓글에 스스로 단 것은 알림 없음
  IF v_notify_user_id = NEW.user_id THEN RETURN NEW; END IF;

  IF NEW.is_anonymous THEN
    v_author_name := '익명';
  ELSE
    SELECT display_name INTO v_author_name FROM public.users WHERE id = NEW.user_id;
    v_author_name := COALESCE(v_author_name, '누군가');
  END IF;

  INSERT INTO public.notifications (user_id, type, message, target_id, target_type)
  VALUES (
    v_notify_user_id,
    v_notif_type,
    v_author_name || CASE WHEN v_notif_type = 'reply' THEN '님이 대댓글을 달았어요' ELSE '님이 댓글을 달았어요' END,
    NEW.post_id,
    'post'
  );

  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. 좋아요/인기글 알림 트리거
-- ============================================================
-- 예전 구현은 COUNT(*) = 10 이라, 좋아요를 취소했다가 다시 누르면 10을 재차 밟아
-- 인기글 알림이 몇 번이고 다시 울렸다. >= 10 + 유니크 인덱스로 게시글당 1회로 고정한다.
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_post_user_id UUID;
  v_like_count   BIGINT;
BEGIN
  SELECT user_id INTO v_post_user_id FROM public.posts WHERE id = NEW.post_id;
  IF v_post_user_id IS NULL THEN RETURN NEW; END IF;
  IF v_post_user_id = NEW.user_id THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, message, target_id, target_type)
  VALUES (v_post_user_id, 'like', '내 게시글에 좋아요가 달렸어요', NEW.post_id, 'post');

  SELECT COUNT(*) INTO v_like_count FROM public.likes WHERE post_id = NEW.post_id;
  IF v_like_count >= 10 THEN
    INSERT INTO public.notifications (user_id, type, message, target_id, target_type)
    VALUES (v_post_user_id, 'popular', '내 게시글이 인기글이 됐어요 🔥', NEW.post_id, 'post')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
