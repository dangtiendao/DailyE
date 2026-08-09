-- ==============================================================================
-- MIGRATION 005_ADMIN_ACTION_LOGS.SQL: NHẬT KÝ THAO TÁC HÀNG LOẠT CỦA ADMIN
-- Ngày khởi tạo: 2026-08-09
-- Mô tả: Tạo bảng admin_action_logs lưu vết toàn bộ thao tác bulk update/delete
--        kèm phân quyền RLS chỉ cho phép tài khoản Admin truy cập.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'bulk_update_status' | 'bulk_update_field' | 'bulk_delete'
  content_type TEXT NOT NULL, -- 'questions' | 'lessons' | 'vocabulary'
  affected_ids JSONB NOT NULL DEFAULT '[]'::JSONB,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INDEX tối ưu truy vấn nhật ký theo thời gian và loại nội dung
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created 
ON public.admin_action_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin_content 
ON public.admin_action_logs (admin_id, content_type);

-- PHÂN QUYỀN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chỉ admin mới được xem và ghi log thao tác" ON public.admin_action_logs;
CREATE POLICY "Chỉ admin mới được xem và ghi log thao tác"
  ON public.admin_action_logs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
