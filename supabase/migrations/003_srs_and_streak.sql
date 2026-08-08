-- ==============================================================================
-- MIGRATION 003_SRS_AND_STREAK.SQL: SỔ LỖI SAI, SRS & CHUỖI STREAK HỌC TẬP
-- Ngày khởi tạo: 2026-08-08
-- Mô tả: Bổ sung theo dõi 2 lần đúng liên tiếp để resolved câu sai và chuỗi ngày học liên tiếp.
-- ==============================================================================

-- 1. Bổ sung cột consecutive_correct vào bảng error_logs (nếu chưa có)
ALTER TABLE public.error_logs 
ADD COLUMN IF NOT EXISTS consecutive_correct INT DEFAULT 0 NOT NULL;

-- 2. Bổ sung cột streak_count và last_active_date vào bảng profiles (nếu chưa có)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streak_count INT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_active_date DATE NULL;

-- 3. Tạo index hỗ trợ tìm kiếm items SRS đến hạn ôn tập
CREATE INDEX IF NOT EXISTS idx_review_schedule_user_due 
ON public.review_schedule (user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_resolved 
ON public.error_logs (user_id, resolved);
