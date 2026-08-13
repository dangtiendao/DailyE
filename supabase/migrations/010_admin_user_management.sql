-- ==============================================================================
-- MIGRATION 010_ADMIN_USER_MANAGEMENT.SQL: HÀM RPC ĐẾM ADMIN ACTIVE KÈM ROW LOCK
-- Ngày khởi tạo: 2026-08-14
-- Mô tả: Thêm hàm RPC check_active_admin_count_locked() sử dụng Row Lock (FOR UPDATE)
--        triệt tiêu Race Condition khi 2 Admin đồng thời thực hiện thao tác hạ quyền / ban / xóa nhau.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_active_admin_count_locked()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- 1. Thực hiện Row Lock FOR UPDATE trên tất cả dòng profiles có access_level='admin' và status='active'.
  -- Việc này khóa các hàng liên quan trong Transaction cho tới khi Transaction hoàn tất,
  -- ngăn 2 Admin hạ quyền / ban / xóa nhau đồng thời ở cùng 1 thời điểm.
  PERFORM 1 
  FROM public.profiles 
  WHERE access_level = 'admin' AND status = 'active' 
  FOR UPDATE;

  -- 2. Đếm chính xác số lượng Admin active
  SELECT COUNT(*) INTO v_count
  FROM public.profiles
  WHERE access_level = 'admin' AND status = 'active';

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_active_admin_count_locked() TO authenticated, service_role;
