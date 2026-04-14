-- ============================================================
-- 1. notifications type constraint 수정 (badge 복구)
-- ============================================================
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'bingo_reminder', 'bingo_dday',
  'comment', 'reply', 'like', 'popular',
  'battle_request', 'battle_accepted',
  'friend_request',
  'badge'
));

-- target_type constraint: NULL 허용 명시 + badge 포함
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_target_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_target_type_check CHECK (
  target_type IS NULL OR target_type IN ('post', 'bingo_board', 'badge')
);


-- ============================================================
-- 2. 댓글/대댓글 알림 트리거
-- ============================================================
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

  v_notify_user_id := v_post_author_id;
  v_notif_type := CASE WHEN NEW.parent_id IS NOT NULL THEN 'reply' ELSE 'comment' END;

  -- 자기 글/댓글에 자기 답글은 알림 없음
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

DROP TRIGGER IF EXISTS trg_notify_comment ON public.comments;
CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();


-- ============================================================
-- 3. 좋아요/인기글 알림 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_post_user_id UUID;
  v_like_count   BIGINT;
BEGIN
  SELECT user_id INTO v_post_user_id FROM public.posts WHERE id = NEW.post_id;
  IF v_post_user_id IS NULL THEN RETURN NEW; END IF;
  IF v_post_user_id = NEW.user_id THEN RETURN NEW; END IF;

  -- 좋아요 알림
  INSERT INTO public.notifications (user_id, type, message, target_id, target_type)
  VALUES (v_post_user_id, 'like', '내 게시글에 좋아요가 달렸어요', NEW.post_id, 'post');

  -- 인기글 달성 알림 (좋아요 10개 정확히 도달 시 1회)
  SELECT COUNT(*) INTO v_like_count FROM public.likes WHERE post_id = NEW.post_id;
  IF v_like_count = 10 THEN
    INSERT INTO public.notifications (user_id, type, message, target_id, target_type)
    VALUES (v_post_user_id, 'popular', '내 게시글이 인기글이 됐어요 🔥', NEW.post_id, 'post');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_like ON public.likes;
CREATE TRIGGER trg_notify_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();
