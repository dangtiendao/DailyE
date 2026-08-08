-- ==============================================================================
-- MIGRATION 004_VOCAB_SYSTEM.SQL: SCHEMA THƯ VIỆN & HỆ THỐNG TỪ VỰNG TƯƠNG TÁC
-- Ngày khởi tạo: 2026-08-08
-- Mô tả: Bảng vocab_topics (seed 12 chủ đề), cập nhật vocabulary_items,
--        tạo bảng user_vocab_progress, vocab_sessions, cập nhật constraint review_schedule,
--        và cài đặt Row Level Security (RLS) bảo mật dữ liệu.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BẢNG VOCAB_TOPICS (Danh mục chủ đề từ vựng TOEIC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vocab_topics (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0
);

-- Seed 12 topic từ vựng chuẩn TOEIC với tên tiếng Việt và emoji
INSERT INTO public.vocab_topics (code, display_name, order_index) VALUES
  ('office', '🏢 Văn phòng', 1),
  ('hr', '👥 Tuyển dụng & Nhân sự', 2),
  ('meeting', '📋 Họp & Sự kiện', 3),
  ('finance', '💰 Tài chính & Ngân hàng', 4),
  ('marketing', '📣 Marketing & Bán hàng', 5),
  ('travel', '✈️ Du lịch & Di chuyển', 6),
  ('shopping', '🛒 Mua sắm & Dịch vụ', 7),
  ('production', '🏭 Sản xuất & Vận chuyển', 8),
  ('technology', '💻 Công nghệ', 9),
  ('health', '🏥 Sức khỏe', 10),
  ('restaurant', '🍽️ Nhà hàng & Ẩm thực', 11),
  ('real_estate', '🏠 Bất động sản', 12)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  order_index = EXCLUDED.order_index;


-- ------------------------------------------------------------------------------
-- 2. CẬP NHẬT BẢNG VOCABULARY_ITEMS (Kho từ vựng nâng cấp)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.vocabulary_items CASCADE;

CREATE TABLE public.vocabulary_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  word TEXT NOT NULL,
  word_type TEXT NULL CHECK (word_type IN ('n', 'v', 'adj', 'adv', 'phrase')),
  meaning_vi TEXT NOT NULL,
  example TEXT NULL,
  example_blank TEXT NULL,
  topic TEXT NOT NULL REFERENCES public.vocab_topics(code) ON DELETE RESTRICT,
  level_tag TEXT NULL,
  audio_url TEXT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_vocabulary_items_word_type_topic UNIQUE (word, word_type, topic)
);

CREATE INDEX idx_vocabulary_items_topic_level_status 
ON public.vocabulary_items (topic, level_tag, status);


-- ------------------------------------------------------------------------------
-- 3. BẢNG USER_VOCAB_PROGRESS (Tiến độ học & ghi nhớ từ vựng cá nhân)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_vocab_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vocab_id BIGINT NOT NULL REFERENCES public.vocabulary_items(id) ON DELETE CASCADE,
  familiarity SMALLINT NOT NULL DEFAULT 0 CHECK (familiarity BETWEEN 0 AND 3), -- 0: Mới, 1: Đã gặp, 2: Nhớ mờ, 3: Thuộc
  correct_streak SMALLINT NOT NULL DEFAULT 0,
  total_correct INT NOT NULL DEFAULT 0,
  total_wrong INT NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ NULL,
  CONSTRAINT uq_user_vocab_progress_user_vocab UNIQUE (user_id, vocab_id)
);

CREATE INDEX idx_user_vocab_progress_user_familiarity 
ON public.user_vocab_progress (user_id, familiarity);


-- ------------------------------------------------------------------------------
-- 4. BẢNG VOCAB_SESSIONS (Nhật ký các phiên làm bài từ vựng)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vocab_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('learn_new', 'mcq_en_vi', 'mcq_vi_en', 'matching', 'mixed', 'review')),
  total_items INT NOT NULL,
  correct_items INT NOT NULL,
  duration_seconds INT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_vocab_sessions_user_created 
ON public.vocab_sessions (user_id, created_at);


-- ------------------------------------------------------------------------------
-- 5. CẬP NHẬT CONSTRAINT REVIEW_SCHEDULE (Hỗ trợ Spaced Repetition cho Vocab)
-- ------------------------------------------------------------------------------
ALTER TABLE public.review_schedule DROP CONSTRAINT IF EXISTS review_schedule_item_type_check;
ALTER TABLE public.review_schedule ADD CONSTRAINT review_schedule_item_type_check 
  CHECK (item_type IN ('question', 'vocab', 'vocabulary'));


-- ------------------------------------------------------------------------------
-- 6. PHÂN QUYỀN ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

-- A. BẢNG VOCAB_TOPICS: Mọi user đăng nhập được SELECT; chỉ Admin được INSERT/UPDATE/DELETE
ALTER TABLE public.vocab_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mọi user đăng nhập được xem vocab_topics" ON public.vocab_topics;
CREATE POLICY "Mọi user đăng nhập được xem vocab_topics"
  ON public.vocab_topics FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Chỉ admin mới được quản lý vocab_topics" ON public.vocab_topics;
CREATE POLICY "Chỉ admin mới được quản lý vocab_topics"
  ON public.vocab_topics FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- B. BẢNG VOCABULARY_ITEMS: User thường đọc dòng status='published'; Admin toàn quyền
ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User xem từ vựng published, Admin xem tất cả" ON public.vocabulary_items;
CREATE POLICY "User xem từ vựng published, Admin xem tất cả"
  ON public.vocabulary_items FOR SELECT
  TO authenticated
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Chỉ Admin quản lý vocabulary_items" ON public.vocabulary_items;
CREATE POLICY "Chỉ Admin quản lý vocabulary_items"
  ON public.vocabulary_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- C. BẢNG USER_VOCAB_PROGRESS: User chỉ SELECT/INSERT/UPDATE/DELETE dòng của chính mình
ALTER TABLE public.user_vocab_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User quản lý tiến độ từ vựng cá nhân" ON public.user_vocab_progress;
CREATE POLICY "User quản lý tiến độ từ vựng cá nhân"
  ON public.user_vocab_progress FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());


-- D. BẢNG VOCAB_SESSIONS: User chỉ SELECT/INSERT dòng của chính mình
ALTER TABLE public.vocab_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User quản lý lịch sử phiên học cá nhân" ON public.vocab_sessions;
CREATE POLICY "User quản lý lịch sử phiên học cá nhân"
  ON public.vocab_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());


/*
==============================================================================
THỨ TỰ THỰC THI & 3 CÂU QUERY KIỂM TRA BẢO MẬT RLS TRÊN SUPABASE SQL EDITOR
==============================================================================

THỨ TỰ CHẠY SCRIPT:
1. Chạy file: supabase/scripts/reset_test_data.sql (Dọn dẹp sạch bảng test cũ)
2. Chạy file: supabase/migrations/004_vocab_system.sql (Tạo schema từ vựng mới)

------------------------------------------------------------------------------
3 CÂU QUERY VERIFY RLS (CHẠY ĐỂ TEST BẢO MẬT):

-- Câu 1: Giả lập User thường đọc vocab_topics -> KẾT QUẢ: THÀNH CÔNG (Trả về đủ 12 chủ đề)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';
SELECT code, display_name FROM public.vocab_topics ORDER BY order_index;

-- Câu 2: Giả lập User thường đọc user_vocab_progress của người khác (User ID khác auth.uid)
-- KẾT QUẢ: BỊ CHẶN / TRẢ VỀ 0 ROWS (Do policy user_id = auth.uid())
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';
SELECT * FROM public.user_vocab_progress WHERE user_id = '99999999-9999-9999-9999-999999999999';

-- Câu 3: Giả lập User thường chèn thêm chủ đề vào vocab_topics 
-- KẾT QUẢ: BỊ CHẶN LỖI RLS (new row violates row-level security policy for table "vocab_topics")
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';
INSERT INTO public.vocab_topics (code, display_name) VALUES ('hack_topic', 'Hacker Topic');

==============================================================================
*/
