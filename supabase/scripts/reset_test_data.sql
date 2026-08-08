-- ==============================================================================
-- SCRIPT RESET DỮ LIỆU TEST DÀNH CHO DỰ ÁN DAILYE
-- CẢNH BÁO: CHỈ chạy khi DB toàn dữ liệu test
-- ==============================================================================
-- Mô tả: Script này dọn dẹp sạch toàn bộ dữ liệu mẫu / dữ liệu chạy thử trong DB,
-- nhưng GIỮ NGUYÊN tài khoản học viên, tài khoản Admin (profiles) và auth.users.
-- ==============================================================================

TRUNCATE TABLE 
  public.user_answers,
  public.test_attempts,
  public.error_logs,
  public.review_schedule,
  public.lesson_progress,
  public.content_imports,
  public.lesson_questions,
  public.test_questions,
  public.questions,
  public.lessons,
  public.tests,
  public.vocabulary_items
RESTART IDENTITY CASCADE;
