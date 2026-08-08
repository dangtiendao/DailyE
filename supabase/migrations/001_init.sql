-- ==============================================================================
-- MIGRATION 001_INIT.SQL: KHỞI TẠO CƠ SỞ DỮ LIỆU POSTGRESQL CHO DAILYE (SUPABASE)
-- Ngày khởi tạo: 2026-08-08
-- Mô tả: Chứa toàn bộ 12 bảng, ENUMs/CHECK constraints, Foreign Keys, Indexes, 
-- Triggers tự động tạo Profile, RLS Policies phân quyền, và VIEW an toàn cho câu hỏi.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TẠO CÁC BẢNG DỮ LIỆU CHÍNH (TABLES & CONSTRAINTS)
-- ------------------------------------------------------------------------------

-- BẢNG 1: PROFILES (Thông tin cá nhân & Phân quyền người dùng)
-- Ghi chú ON DELETE CASCADE: id tham chiếu auth.users(id). Khi tài khoản auth bị xóa,
-- toàn bộ hồ sơ profile tương ứng tự động được dọn dẹp.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  target_score INTEGER CHECK (target_score IN (350, 500, 650, 800, 900)) DEFAULT 500 NOT NULL,
  access_level TEXT CHECK (access_level IN ('free', 'premium', 'admin')) DEFAULT 'free' NOT NULL,
  current_level TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BẢNG 2: LESSONS (Bài học kiến thức Từ vựng / Ngữ pháp / Kỹ năng)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL, -- Định dạng Markdown
  skill TEXT CHECK (skill IN ('vocabulary', 'grammar', 'listening', 'reading', 'strategy')) NOT NULL,
  level_tag TEXT NULL,
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft' NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BẢNG 3: QUESTIONS (Kho câu hỏi TOEIC Part 1 - 7)
-- Ghi chú: Chứa đáp án đúng (correct_answer) và giải thích (explanation).
-- Client người học KHÔNG query trực tiếp bảng này mà sử dụng VIEW published_questions_safe.
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- Ví dụ: P5-0001
  exam_part TEXT CHECK (exam_part IN ('part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'part7')) NOT NULL,
  question_type TEXT NULL,
  level_tag TEXT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Dạng {"A": "...", "B": "...", "C": "...", "D": "..."}
  correct_answer TEXT CHECK (correct_answer IN ('A', 'B', 'C', 'D')) NOT NULL,
  explanation TEXT NULL,
  knowledge_tag TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  topic TEXT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium' NOT NULL,
  image_url TEXT NULL, -- URL nullable cho giai đoạn đầu
  audio_url TEXT NULL, -- URL nullable cho giai đoạn đầu
  transcript TEXT NULL,
  media_source TEXT NULL,
  source_id TEXT NULL,
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BẢNG 4: LESSON_QUESTIONS (Liên kết n-n giữa Bài học và Câu hỏi)
-- Ghi chú ON DELETE CASCADE: Xóa bài học hoặc xóa câu hỏi sẽ tự động xóa dòng liên kết.
CREATE TABLE IF NOT EXISTS public.lesson_questions (
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  PRIMARY KEY (lesson_id, question_id)
);

-- BẢNG 5: TESTS (Danh sách đề thi: Mini / Part / Full Test)
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  test_type TEXT CHECK (test_type IN ('mini', 'part', 'full')) NOT NULL,
  time_limit_minutes INTEGER DEFAULT 120 NOT NULL,
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BẢNG 6: TEST_QUESTIONS (Mối quan hệ n-n giữa Đề thi và Câu hỏi)
-- Ghi chú ON DELETE CASCADE: Tự động xóa dòng liên kết khi bài test hoặc câu hỏi bị xóa.
CREATE TABLE IF NOT EXISTS public.test_questions (
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  PRIMARY KEY (test_id, question_id)
);

-- BẢNG 7: TEST_ATTEMPTS (Lần làm đề / Luyện tập của người dùng)
-- Ghi chú ON DELETE:
-- - user_id: CASCADE (Xóa học viên thì xóa lịch sử làm bài).
-- - test_id: SET NULL (Nếu admin xóa bộ đề, kết quả điểm số làm bài trong quá khứ của học viên vẫn được lưu trữ).
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES public.tests(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  finished_at TIMESTAMPTZ NULL,
  score INTEGER DEFAULT 0 NOT NULL,
  total_questions INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BẢNG 8: USER_ANSWERS (Chi tiết đáp án người dùng chọn cho từng câu hỏi)
-- Ghi chú ON DELETE CASCADE: Khi xóa lần làm bài (test_attempt) hoặc câu hỏi, các câu trả lời tương ứng tự động dọn dẹp.
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  selected_answer TEXT CHECK (selected_answer IN ('A', 'B', 'C', 'D')) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BẢNG 9: ERROR_LOGS (Sổ lỗi sai tự động ghi nhận các câu làm sai)
-- Ghi chú ON DELETE CASCADE: Xóa tài khoản hoặc câu hỏi sẽ xóa luôn log lỗi sai liên quan.
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  knowledge_tag TEXT NULL,
  wrong_count INTEGER DEFAULT 1 NOT NULL,
  last_wrong_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved BOOLEAN DEFAULT FALSE NOT NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BẢNG 10: REVIEW_SCHEDULE (Lịch ôn tập ngắt quãng SRS - Spaced Repetition System)
-- Ghi chú ON DELETE CASCADE: Dữ liệu SRS gắn liền với tài khoản học viên.
CREATE TABLE IF NOT EXISTS public.review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT CHECK (item_type IN ('question', 'vocab')) NOT NULL,
  item_id UUID NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  interval_days NUMERIC DEFAULT 1 NOT NULL,
  ease_factor NUMERIC DEFAULT 2.5 NOT NULL,
  review_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BẢNG 11: VOCABULARY_ITEMS (Kho từ vựng TOEIC)
CREATE TABLE IF NOT EXISTS public.vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  meaning_vi TEXT NOT NULL,
  example TEXT NULL,
  topic TEXT NULL,
  level_tag TEXT NULL,
  audio_url TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BẢNG 12: CONTENT_IMPORTS (Lịch sử import dữ liệu từ file Excel của Admin)
-- Ghi chú ON DELETE SET NULL: Nếu tài khoản admin bị xóa, nhật ký lịch sử import đề vẫn được giữ lại phục vụ audit.
CREATE TABLE IF NOT EXISTS public.content_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  total_rows INTEGER DEFAULT 0 NOT NULL,
  success_rows INTEGER DEFAULT 0 NOT NULL,
  error_rows INTEGER DEFAULT 0 NOT NULL,
  error_detail JSONB DEFAULT '[]'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


-- ------------------------------------------------------------------------------
-- 2. TẠO CÁC INDEX TỐI ƯU HIỆU NĂNG QUERY
-- ------------------------------------------------------------------------------

-- Index cho câu hỏi theo Part, Trạng thái (Published) và Level
CREATE INDEX IF NOT EXISTS idx_questions_part_status_level 
ON public.questions (exam_part, status, level_tag);

-- Index cho Sổ lỗi sai theo học viên và trạng thái chưa sửa (resolved = false)
CREATE INDEX IF NOT EXISTS idx_error_logs_user_resolved 
ON public.error_logs (user_id, resolved);

-- Index cho Lịch ôn tập SRS theo học viên và ngày đến hạn ôn (due_date)
CREATE INDEX IF NOT EXISTS idx_review_schedule_user_due 
ON public.review_schedule (user_id, due_date);

-- Foreign Key Indexes hỗ trợ JOIN nhanh
CREATE INDEX IF NOT EXISTS idx_user_answers_attempt ON public.user_answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user ON public.user_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON public.test_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_test ON public.test_questions (test_id);
CREATE INDEX IF NOT EXISTS idx_lesson_questions_lesson ON public.lesson_questions (lesson_id);


-- ------------------------------------------------------------------------------
-- 3. HÀM HELPER & TRIGGER TỰ ĐỘNG TẠO PROFILE KHI ĐĂNG KÝ
-- ------------------------------------------------------------------------------

-- Hàm kiểm tra quyền Admin an toàn (Security Definer)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND access_level = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Tự động chèn dòng mới vào public.profiles khi có user trong auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, access_level, target_score)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Học viên DailyE'),
    'free',
    500
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Đăng ký Trigger với auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------------------------------------------
-- 4. BẢO MẬT ĐÁP ÁN: MVIEW / VIEW CHO CÂU HỎI LUYỆN THI (SAFE VIEW)
-- ------------------------------------------------------------------------------
-- GIẢI THÍCH BẢO MẬT:
-- Để chống đòn đánh F12/Inspect trên Client lộ correct_answer & explanation trước khi nộp bài:
-- 1. Client người học chỉ được phép SELECT qua VIEW `published_questions_safe` bên dưới.
-- 2. VIEW này cố tình LOẠI BỎ 2 cột `correct_answer` và `explanation`.
-- 3. Khi nộp bài, Client gửi câu trả lời về cho Server (Server Action / API Route). 
--    Server sẽ dùng Supabase Service Role Key (quyền Admin) để đối chiếu đáp án từ bảng gốc `questions`
--    và tính toán score, sau đó mới trả kết quả + giải thích về cho Client.

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

-- Cấp quyền SELECT trên VIEW an toàn cho role authenticated và service_role
GRANT SELECT ON public.published_questions_safe TO authenticated;
GRANT SELECT ON public.published_questions_safe TO service_role;


-- ------------------------------------------------------------------------------
-- 5. BẬT ROW LEVEL SECURITY (RLS) & CẤU HÌNH POLICIES TOÀN BỘ BẢNG
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_imports ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- POLICIES CHO BẢNG PROFILES
-- -----------------------------------------
CREATE POLICY "Profiles - User đọc chính mình hoặc Admin đọc tất cả"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles - User sửa chính mình hoặc Admin sửa tất cả"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles - Cho phép insert dòng chính mình hoặc Admin"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- -----------------------------------------
-- POLICIES CHO LESSONS, QUESTIONS, TESTS, VOCABULARY
-- (User đã đăng nhập đọc bài đã Published; Chỉ Admin được Insert/Update/Delete)
-- -----------------------------------------
CREATE POLICY "Lessons - Read published for auth or all for admin"
  ON public.lessons FOR SELECT
  USING ((status = 'published' AND auth.role() = 'authenticated') OR public.is_admin());

CREATE POLICY "Lessons - Admin write access"
  ON public.lessons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Questions - Read published for auth or all for admin"
  ON public.questions FOR SELECT
  USING ((status = 'published' AND auth.role() = 'authenticated') OR public.is_admin());

CREATE POLICY "Questions - Admin write access"
  ON public.questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Tests - Read published for auth or all for admin"
  ON public.tests FOR SELECT
  USING ((status = 'published' AND auth.role() = 'authenticated') OR public.is_admin());

CREATE POLICY "Tests - Admin write access"
  ON public.tests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Vocabulary - Read for auth or all for admin"
  ON public.vocabulary_items FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY "Vocabulary - Admin write access"
  ON public.vocabulary_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------
-- POLICIES CHO BẢNG MỐI QUAN HỆ (LESSON_QUESTIONS, TEST_QUESTIONS)
-- -----------------------------------------
CREATE POLICY "LessonQuestions - Auth read"
  ON public.lesson_questions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "LessonQuestions - Admin write"
  ON public.lesson_questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "TestQuestions - Auth read"
  ON public.test_questions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "TestQuestions - Admin write"
  ON public.test_questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------
-- POLICIES CHO DỮ LIỆU CÁ NHÂN (TEST_ATTEMPTS, USER_ANSWERS, ERROR_LOGS, REVIEW_SCHEDULE)
-- (User chỉ thao tác dữ liệu chính mình; Admin toàn quyền)
-- -----------------------------------------
CREATE POLICY "TestAttempts - User managing own data"
  ON public.test_attempts FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "UserAnswers - User managing own data"
  ON public.user_answers FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "ErrorLogs - User managing own data"
  ON public.error_logs FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "ReviewSchedule - User managing own data"
  ON public.review_schedule FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- -----------------------------------------
-- POLICIES CHO BẢNG CONTENT_IMPORTS (CHỈ ADMIN)
-- -----------------------------------------
CREATE POLICY "ContentImports - Admin only access"
  ON public.content_imports FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- HƯỚNG DẪN CHẠY MIGRATION VÀ TEST RLS TRÊN SUPABASE SQL EDITOR
-- ==============================================================================
/*
THỨ TỰ THỰC HIỆN TRÊN SUPABASE DASHBOARD:

1. Mở trang quản trị Supabase -> Chọn dự án -> Mục "SQL Editor".
2. Tạo Query mới, dán toàn bộ nội dung file SQL này vào và nhấn "Run".
3. Kiểm tra thông báo xuất hiện "Success. No rows returned".

KỊCH BẢN KIỂM TRA RLS BẰNG 2 USER GIẢ LẬP:

--- KỊCH BẢN 1: KÍCH HOẠT TRIGGER KHI ĐĂNG KÝ USER MỚI ---
- Vào mục "Authentication" -> "Users" -> Tạo 2 user giả lập:
  * User A (Learner): learner@dailye.com
  * User B (Admin): admin@dailye.com
- Chạy SQL sau trong SQL Editor để gán quyền Admin cho User B:
  UPDATE public.profiles 
  SET access_level = 'admin' 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@dailye.com');

--- KỊCH BẢN 2: GIẢ LẬP CONTEXT CỦA USER A (LEARNER) ---
SET local role authenticated;
SET local "request.jwt.claim.sub" TO '<UUID_CỦA_USER_A>';

-- Test 2.1: Learner đọc profile chính mình -> THÀNH CÔNG (Trả về 1 dòng)
SELECT * FROM public.profiles WHERE id = '<UUID_CỦA_USER_A>';

-- Test 2.2: Learner cố tình đọc profile của User B -> THẤT BẠI (Trả về 0 dòng nhờ RLS)
SELECT * FROM public.profiles WHERE id = '<UUID_CỦA_USER_B>';

-- Test 2.3: Learner query bảng content_imports -> THẤT BẠI (Trả về 0 dòng)
SELECT * FROM public.content_imports;

-- Test 2.4: Learner xem danh sách câu hỏi an toàn -> THÀNH CÔNG (Không có correct_answer)
SELECT * FROM public.published_questions_safe;

--- KỊCH BẢN 3: GIẢ LẬP CONTEXT CỦA USER B (ADMIN) ---
SET local role authenticated;
SET local "request.jwt.claim.sub" TO '<UUID_CỦA_USER_B>';

-- Test 3.1: Admin đọc toàn bộ profiles -> THÀNH CÔNG (Trả về tất cả dòng)
SELECT * FROM public.profiles;

-- Test 3.2: Admin ghi nhật ký import -> THÀNH CÔNG
INSERT INTO public.content_imports (admin_id, filename, total_rows, success_rows)
VALUES ('<UUID_CỦA_USER_B>', 'de_thi_test.xlsx', 100, 100);

RESET ROLE;
*/
