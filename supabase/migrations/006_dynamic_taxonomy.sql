-- ==============================================================================
-- MIGRATION 006_DYNAMIC_TAXONOMY.SQL: HỆ THỐNG TAXONOMY (TOPIC & LEVEL) ĐỘNG
-- Ngày khởi tạo: 2026-08-09
-- Mô tả:
--  1. Nâng cấp vocab_topics -> topics thành danh mục Topic toàn hệ thống.
--  2. Khởi tạo bảng levels với 4 trình độ cơ bản.
--  3. Chuyển level_tag ở questions, lessons, vocabulary_items thành FK -> levels(code).
--  4. Thêm cột topic vào lessons (FK -> topics(code)).
--  5. Chuyển questions.topic thành FK -> topics(code).
--  6. Đặt RLS Policies cho topics và levels.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. NÂNG CẤP BẢNG TOPIC (RENAME vocab_topics -> topics & THÊM CỘT)
-- ------------------------------------------------------------------------------

-- Đổi tên bảng vocab_topics thành topics nếu đang tồn tại vocab_topics
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vocab_topics') THEN
    ALTER TABLE public.vocab_topics RENAME TO topics;
  END IF;
END $$;

-- Tạo bảng topics nếu chưa có
CREATE TABLE IF NOT EXISTS public.topics (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Thêm các cột mới nếu trước đó đã đổi tên từ vocab_topics
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS description TEXT NULL;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Seed / Update 12 Topic tiêu chuẩn TOEIC
INSERT INTO public.topics (code, display_name, description, order_index, is_active) VALUES
  ('office', '🏢 Văn phòng', 'Từ vựng & ngữ cảnh giao tiếp công sở, thông báo, memo', 1, true),
  ('hr', '👥 Tuyển dụng & Nhân sự', 'Phỏng vấn, tuyển dụng, hợp đồng lao động, chế độ', 2, true),
  ('meeting', '📋 Họp & Sự kiện', 'Hội nghị, thuyết trình, lên lịch trình, sự kiện doanh nghiệp', 3, true),
  ('finance', '💰 Tài chính & Ngân hàng', 'Ngân sách, doanh thu, ngân hàng, báo cáo tài chính', 4, true),
  ('marketing', '📣 Marketing & Bán hàng', 'Quảng cáo, thị trường, chiến dịch bán hàng, khách hàng', 5, true),
  ('travel', '✈️ Du lịch & Di chuyển', 'Chuyến đi công tác, đặt phòng khách sạn, vé máy bay', 6, true),
  ('shopping', '🛒 Mua sắm & Dịch vụ', 'Cửa hàng, hóa đơn, thanh toán, dịch vụ khách hàng', 7, true),
  ('production', '🏭 Sản xuất & Vận chuyển', 'Nhà máy, quy trình sản xuất, đơn hàng, vận chuyển', 8, true),
  ('technology', '💻 Công nghệ', 'Thiết bị điện tử, phần mềm, hệ thống CNTT', 9, true),
  ('health', '🏥 Sức khỏe', 'Y tế, bảo hiểm sức khỏe, khám bệnh, an toàn lao động', 10, true),
  ('restaurant', '🍽️ Nhà hàng & Ẩm thực', 'Đặt bàn, thực đơn, ăn uống kinh doanh', 11, true),
  ('real_estate', '🏠 Bất động sản', 'Thuê văn phòng, mua bán mặt bằng, nhà đất', 12, true)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = COALESCE(EXCLUDED.description, public.topics.description),
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active;


-- ------------------------------------------------------------------------------
-- 2. KHỞI TẠO BẢNG LEVELS (TRÌNH ĐỘ ĐỘNG)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.levels (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 4 Trình độ TOEIC tiêu chuẩn
INSERT INTO public.levels (code, display_name, order_index, is_active) VALUES
  ('350+', '🌱 Mất gốc → 350+', 1, true),
  ('500+', '📗 350 → 500+', 2, true),
  ('650+', '📘 500 → 650+', 3, true),
  ('800+', '🚀 650 → 800+', 4, true)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active;


-- ------------------------------------------------------------------------------
-- 3. CHUYỂN LEVEL_TAG SANG KHÓA NGOẠI (FK -> levels.code)
-- ------------------------------------------------------------------------------

-- Chuẩn hóa dữ liệu test cũ (nếu có level_tag không nằm trong bảng levels -> gán về '500+')
UPDATE public.vocabulary_items SET level_tag = '500+' WHERE level_tag IS NOT NULL AND level_tag NOT IN (SELECT code FROM public.levels);
UPDATE public.lessons SET level_tag = '500+' WHERE level_tag IS NOT NULL AND level_tag NOT IN (SELECT code FROM public.levels);
UPDATE public.questions SET level_tag = '500+' WHERE level_tag IS NOT NULL AND level_tag NOT IN (SELECT code FROM public.levels);

-- Thêm Foreign Key ràng buộc level_tag ở bảng vocabulary_items
ALTER TABLE public.vocabulary_items
  DROP CONSTRAINT IF EXISTS fk_vocabulary_items_level_tag;

ALTER TABLE public.vocabulary_items
  ADD CONSTRAINT fk_vocabulary_items_level_tag
  FOREIGN KEY (level_tag) REFERENCES public.levels(code) ON DELETE RESTRICT;

-- Thêm Foreign Key ràng buộc level_tag ở bảng lessons
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS fk_lessons_level_tag;

ALTER TABLE public.lessons
  ADD CONSTRAINT fk_lessons_level_tag
  FOREIGN KEY (level_tag) REFERENCES public.levels(code) ON DELETE RESTRICT;

-- Thêm Foreign Key ràng buộc level_tag ở bảng questions
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS fk_questions_level_tag;

ALTER TABLE public.questions
  ADD CONSTRAINT fk_questions_level_tag
  FOREIGN KEY (level_tag) REFERENCES public.levels(code) ON DELETE RESTRICT;


-- ------------------------------------------------------------------------------
-- 4. BỔ SUNG CỘT TOPIC CHO BẢNG LESSONS (FK -> topics.code)
-- ------------------------------------------------------------------------------

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS topic TEXT NULL;

-- Thêm FK ràng buộc topic ở bảng lessons (NULL = bài thuộc nhóm "Chung")
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS fk_lessons_topic;

ALTER TABLE public.lessons
  ADD CONSTRAINT fk_lessons_topic
  FOREIGN KEY (topic) REFERENCES public.topics(code) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_topic_status ON public.lessons (topic, status);


-- ------------------------------------------------------------------------------
-- 5. CHUYỂN QUESTIONS.TOPIC THÀNH KHÓA NGOẠI (FK -> topics.code)
-- ------------------------------------------------------------------------------

-- GHI CHÚ QUAN TRỌNG:
-- Cột questions.topic trước đây chứa chuỗi tự do (ví dụ: "Business Meeting", "Office").
-- Trước khi ép Foreign Key, ta đưa tất cả các giá trị topic tự do không khớp với mã topic chuẩn trong bảng `topics` về NULL.
UPDATE public.questions
SET topic = NULL
WHERE topic IS NOT NULL AND topic NOT IN (SELECT code FROM public.topics);

-- Thêm FK ràng buộc topic ở bảng questions
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS fk_questions_topic;

ALTER TABLE public.questions
  ADD CONSTRAINT fk_questions_topic
  FOREIGN KEY (topic) REFERENCES public.topics(code) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_questions_topic_part_status ON public.questions (topic, exam_part, status);


-- ------------------------------------------------------------------------------
-- 6. THIẾT LẬP ROW LEVEL SECURITY (RLS) CHO BẢNG TOPICS VÀ LEVELS
-- ------------------------------------------------------------------------------

-- RLS Bảng topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mọi user đăng nhập được xem topics" ON public.topics;
CREATE POLICY "Mọi user đăng nhập được xem topics"
  ON public.topics FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Chỉ admin mới được quản lý topics" ON public.topics;
CREATE POLICY "Chỉ admin mới được quản lý topics"
  ON public.topics FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Bảng levels
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mọi user đăng nhập được xem levels" ON public.levels;
CREATE POLICY "Mọi user đăng nhập được xem levels"
  ON public.levels FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Chỉ admin mới được quản lý levels" ON public.levels;
CREATE POLICY "Chỉ admin mới được quản lý levels"
  ON public.levels FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ------------------------------------------------------------------------------
-- 7. CẬP NHẬT VIEW AN TOÀN PUBLISHED_QUESTIONS_SAFE
-- ------------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.published_questions_safe AS
SELECT
  id,
  code,
  exam_part,
  question_type,
  level_tag,
  question_text,
  options,
  knowledge_tag,
  topic,
  difficulty,
  image_url,
  audio_url,
  transcript,
  media_source,
  source_id,
  status,
  created_at
FROM public.questions
WHERE status = 'published';

GRANT SELECT ON public.published_questions_safe TO authenticated;


-- ==============================================================================
-- HƯỚNG DẪN CHẠY VÀ KỊCH BẢN KIỂM THỬ (VERIFICATION QUERIES)
-- ==============================================================================
-- Thứ tự chạy trong Supabase SQL Editor:
-- 1. Chạy file này: supabase/migrations/006_dynamic_taxonomy.sql
-- 2. Chạy script: supabase/scripts/seed_vocab_test.sql (nếu muốn nạp lại 25 từ vựng mẫu)
--
-- QUERIES VERIFY 1: User thường chèn bảng levels -> BỊ RLS CHẶN
--   SET LOCAL ROLE authenticated;
--   SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000000", "role": "authenticated"}';
--   INSERT INTO public.levels (code, display_name) VALUES ('999+', 'Hack Level');
--   --> KẾT QUẢ MONGB MỎI: Error "new row violates row-level security policy for table levels"
--
-- QUERIES VERIFY 2: Insert vocabulary_items với level_tag sai ('999+') -> BỊ FK CHẶN
--   INSERT INTO public.vocabulary_items (word, word_type, meaning_vi, topic, level_tag) 
--   VALUES ('test', 'n', 'thử nghiệm', 'office', '999+');
--   --> KẾT QUẢ MONG ĐỢI: Error "insert or update on table vocabulary_items violates foreign key constraint fk_vocabulary_items_level_tag"
--
-- QUERIES VERIFY 3: Insert lessons với topic không tồn tại ('invalid_topic') -> BỊ FK CHẶN
--   INSERT INTO public.lessons (title, slug, content, skill, topic)
--   VALUES ('Test Lesson', 'test-lesson', 'Content', 'grammar', 'invalid_topic');
--   --> KẾT QUẢ MONG ĐỢI: Error "insert or update on table lessons violates foreign key constraint fk_lessons_topic"
-- ==============================================================================
