-- ==============================================================================
-- MIGRATION 009_ACCOUNT_MANAGEMENT.SQL: MỞ RỘNG PROFILES & QUẢN LÝ TÀI KHOẢN
-- Ngày khởi tạo: 2026-08-14
-- Mô tả: 
-- 1. Bổ sung các cột email, status, banned_reason, daily_goal_minutes vào profiles.
-- 2. Cập nhật trigger handle_new_user() ghi nhận email từ auth.users & backfill.
-- 3. Siết RLS policy FOR UPDATE trên bảng profiles (User không được sửa cột nhạy cảm).
-- 4. Hàm RPC count_active_admins() kiểm tra điều kiện an toàn admin active >= 1.
-- 5. Hàm RPC reset_my_progress() dọn dẹp nguyên tử (Transaction) tiến độ học 7 bảng.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. MỞ RỘNG BẢNG PROFILES & INDEXES
-- ------------------------------------------------------------------------------

-- Email (Bản sao từ auth.users để query danh sách user không cần gọi Auth Admin API)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT NULL;

-- Trạng thái tài khoản (active: Hoạt động, banned: Bị khóa)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'banned'));

-- Lý do khóa tài khoản
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_reason TEXT NULL;

-- Mục tiêu học tập hàng ngày (phút), mặc định 15 phút (giới hạn 5 - 240 phút)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_goal_minutes INT DEFAULT 15 
CHECK (daily_goal_minutes BETWEEN 5 AND 240);

-- Indexes tối ưu truy vấn danh sách & tìm kiếm người dùng
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_access_level ON public.profiles (access_level);

-- Trigger Function: Tự động cập nhật cột updated_at khi row thay đổi
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();


-- ------------------------------------------------------------------------------
-- 2. CẬP NHẬT TRIGGER TẠO PROFILE & BACKFILL DỮ LIỆU EMAIL
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, access_level, target_score, daily_goal_minutes, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Học viên DailyE'),
    NEW.email,
    'free',
    500,
    15,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BACKFILL DỮ LIỆU EMAIL TỪ auth.users SANG public.profiles CHO CÁC USER HIỆN CÓ
-- Cách thực thi: Câu lệnh này sẽ tự động chạy trong migration script khi áp dụng vào Supabase CLI / SQL Editor.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email <> u.email);


-- ------------------------------------------------------------------------------
-- 3. SIẾT QUYỀN RLS BẢNG PROFILES (PHƯƠNG ÁN BẢO MẬT ĐÃ DUYỆT)
-- ------------------------------------------------------------------------------

-- Xóa policy UPDATE cũ (nếu có)
DROP POLICY IF EXISTS "Profiles - User sửa chính mình hoặc Admin sửa tất cả" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - User cap nhat ho so ca nhan" ON public.profiles;

-- POLICY RLS UPDATE MỚI:
-- GHI CHÚ KIẾN TRÚC & LỰA CHỌN BẢO MẬT:
-- 1. User thường chỉ được phép UPDATE dòng profile của chính mình (auth.uid() = id).
-- 2. Mệnh đề WITH CHECK đối chiếu các cột nhạy cảm (access_level, status, banned_reason, email)
--    với giá trị hiện tại trong cơ sở dữ liệu. Nếu bất kỳ trường nhạy cảm nào bị sửa đổi từ Client,
--    PostgreSQL RLS sẽ REJECT câu lệnh UPDATE ngay lập tức.
-- 3. Thao tác của Admin (đổi role, ban/unban user khác) BẮT BUỘC phải thông qua Server Action
--    sử dụng Supabase Service Role Key (Bypasses RLS). Điều này ngăn chặn hoàn toàn đòn đánh F12/Inspect
--    thay đổi role ở Client side và cho phép kiểm tra logic Server (>= 1 admin active) trước khi ghi log.
CREATE POLICY "Profiles - User cap nhat ho so ca nhan"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND access_level = (SELECT p.access_level FROM public.profiles p WHERE p.id = auth.uid())
    AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
    AND COALESCE(banned_reason, '') IS NOT DISTINCT FROM COALESCE((SELECT p.banned_reason FROM public.profiles p WHERE p.id = auth.uid()), '')
    AND COALESCE(email, '') IS NOT DISTINCT FROM COALESCE((SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()), '')
  );


-- ------------------------------------------------------------------------------
-- 4. HÀM RPC: count_active_admins()
-- ------------------------------------------------------------------------------
-- LÝ DO CẦN RPC SECURITY DEFINER:
-- Đảm bảo quy tắc an toàn bất di bất dịch "Luôn còn >= 1 Admin active trong hệ thống" ở tầng Server.
-- Đếm ở Client không an toàn (client có thể bị sửa đổi logic) và RLS có thể giới hạn kết quả truy vấn.
-- RPC này chạy với quyền SECURITY DEFINER trả về con số chính xác tuyệt đối số Admin có status='active'.

CREATE OR REPLACE FUNCTION public.count_active_admins()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.profiles
  WHERE access_level = 'admin' AND status = 'active';
  
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.count_active_admins() TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 5. HÀM RPC: reset_my_progress() - RESET TIẾN ĐỘ HỌC CỦA CHÍNH USER
-- ------------------------------------------------------------------------------
-- LÝ DO SỬ DỤNG RPC VÀ NGUYÊN TẮC THỰC THI:
-- 1. Gom tất cả câu lệnh DELETE trên 7 bảng tiến độ (error_logs, review_schedule, user_vocab_progress,
--    vocab_sessions, user_answers, test_attempts, lesson_progress) vào 1 SQL Transaction duy nhất.
--    Nếu có lỗi xảy ra ở bất kỳ bảng nào, toàn bộ transaction tự động ROLLBACK 100%.
-- 2. v_user_id = auth.uid() lấy từ session server-side, đảm bảo user chỉ dọn dẹp được dữ liệu của chính mình.
-- 3. XỬ LÝ STREAK: Bảng profiles và các thuộc tính chuỗi ngày học (streak_count, last_active_date) KHÔNG bị xóa
--    hay reset, vì streak phản ánh chuỗi ngày truy cập/chuyên cần cá nhân thuộc về hồ sơ profile.

CREATE OR REPLACE FUNCTION public.reset_my_progress()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count_error_logs INT := 0;
  v_count_review_schedule INT := 0;
  v_count_user_vocab_progress INT := 0;
  v_count_vocab_sessions INT := 0;
  v_count_user_answers INT := 0;
  v_count_test_attempts INT := 0;
  v_count_lesson_progress INT := 0;
BEGIN
  -- 1. Kiểm tra xác thực session người dùng
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.';
  END IF;

  -- 2. Dọn dẹp dữ liệu học tập trong 1 Transaction nguyên tử

  -- A. Sổ lỗi sai (error_logs)
  DELETE FROM public.error_logs WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_count_error_logs = ROW_COUNT;

  -- B. Lịch ôn tập SRS (review_schedule)
  DELETE FROM public.review_schedule WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_count_review_schedule = ROW_COUNT;

  -- C. Tiến độ học từ vựng (user_vocab_progress)
  DELETE FROM public.user_vocab_progress WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_count_user_vocab_progress = ROW_COUNT;

  -- D. Nhật ký phiên từ vựng (vocab_sessions)
  DELETE FROM public.vocab_sessions WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_count_vocab_sessions = ROW_COUNT;

  -- E. Chi tiết đáp án bài thi (user_answers)
  DELETE FROM public.user_answers WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_count_user_answers = ROW_COUNT;

  -- F. Lần làm bài thi / luyện tập (test_attempts)
  DELETE FROM public.test_attempts WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_count_test_attempts = ROW_COUNT;

  -- G. Tiến độ hoàn thành bài học (lesson_progress)
  DELETE FROM public.lesson_progress WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_count_lesson_progress = ROW_COUNT;

  -- 3. Trả về chi tiết kết quả xóa theo dạng JSONB
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'deleted_error_logs', v_count_error_logs,
    'deleted_review_schedule', v_count_review_schedule,
    'deleted_user_vocab_progress', v_count_user_vocab_progress,
    'deleted_vocab_sessions', v_count_vocab_sessions,
    'deleted_user_answers', v_count_user_answers,
    'deleted_test_attempts', v_count_test_attempts,
    'deleted_lesson_progress', v_count_lesson_progress
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_my_progress() TO authenticated;


-- ==============================================================================
-- 6. KỊCH BẢN KIỂM TRA VERIFY RLS (3 SQL TEST QUERIES):
-- ==============================================================================
/*
  -- Giả định thực thi dưới vai trò User thường (auth.uid() = '00000000-0000-0000-0000-000000000001'):

  -- TEST QUERY 1: User thường tự update access_level='admin'
  -- MONG ĐỔI: FAIL (Lỗi RLS policy violation)
  UPDATE public.profiles 
  SET access_level = 'admin' 
  WHERE id = auth.uid();

  -- TEST QUERY 2: User thường đang banned tự update status='active'
  -- MONG ĐỔI: FAIL (Lỗi RLS policy violation)
  UPDATE public.profiles 
  SET status = 'active' 
  WHERE id = auth.uid();

  -- TEST QUERY 3: User thường update hợp lệ full_name & daily_goal_minutes
  -- MONG ĐỔI: PASS (Thành công 1 dòng)
  UPDATE public.profiles 
  SET full_name = 'Nguyễn Văn Test', daily_goal_minutes = 30 
  WHERE id = auth.uid();
*/
