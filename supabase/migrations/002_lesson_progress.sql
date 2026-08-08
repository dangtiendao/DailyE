-- ==============================================================================
-- MIGRATION 002_LESSON_PROGRESS.SQL: TIẾN ĐỘ HỌC BÀI HỌC
-- ngày khởi tạo: 2026-08-08
-- Mô tả: Tạo bảng lưu vết các bài học đã hoàn thành của từng học viên kèm RLS.
-- ==============================================================================

-- BẢNG LESSON_PROGRESS
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);

-- INDEX hỗ trợ query tiến độ học viên
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress (user_id);

-- BẬT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- POLICY: Học viên chỉ thao tác (SELECT, INSERT, DELETE) tiến độ của chính mình
CREATE POLICY "LessonProgress - User managing own progress"
  ON public.lesson_progress FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
