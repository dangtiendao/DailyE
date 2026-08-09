-- ==============================================================================
-- MIGRATION 007_MOVE_TOPIC_CONTENT_RPC.SQL: TRANSACTION RPC DI CHUYỂN NỘI DUNG TOPIC
-- Ngày khởi tạo: 2026-08-09
-- Mô tả: Tạo Stored Procedure (RPC Function) di chuyển hàng loạt dữ liệu
--        (vocabulary_items, lessons, questions) từ topic nguồn sang topic đích.
--        Chạy trong 1 SQL Transaction block duy nhất: nếu bất kỳ câu lệnh nào lỗi,
--        toàn bộ thao tác sẽ ROLLBACK 100%.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.move_topic_content(
  from_code TEXT,
  to_code TEXT,
  move_vocab BOOLEAN DEFAULT TRUE,
  move_lessons BOOLEAN DEFAULT TRUE,
  move_questions BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_active BOOLEAN;
  v_vocab_count INT := 0;
  v_lesson_count INT := 0;
  v_question_count INT := 0;
BEGIN
  -- 1. Kiểm tra tham số đầu vào
  IF from_code IS NULL OR to_code IS NULL THEN
    RAISE EXCEPTION 'Mã topic nguồn và topic đích không được để trống.';
  END IF;

  IF lower(trim(from_code)) = lower(trim(to_code)) THEN
    RAISE EXCEPTION 'Topic nguồn và Topic đích không được trùng nhau.';
  END IF;

  -- 2. Kiểm tra Topic đích phải tồn tại và đang hoạt động (is_active = true)
  SELECT is_active INTO v_target_active
  FROM public.topics
  WHERE code = lower(trim(to_code));

  IF v_target_active IS NULL THEN
    RAISE EXCEPTION 'Topic đích "%" không tồn tại trong hệ thống.', to_code;
  END IF;

  IF NOT v_target_active THEN
    RAISE EXCEPTION 'Topic đích "%" đang bị ẩn, không thể nhận dữ liệu mới.', to_code;
  END IF;

  -- 3. Di chuyển Từ vựng (vocabulary_items) trong Transaction
  IF move_vocab THEN
    UPDATE public.vocabulary_items
    SET topic = lower(trim(to_code))
    WHERE topic = lower(trim(from_code));

    GET DIAGNOSTICS v_vocab_count = ROW_COUNT;
  END IF;

  -- 4. Di chuyển Bài học (lessons) trong Transaction
  IF move_lessons THEN
    UPDATE public.lessons
    SET topic = lower(trim(to_code)),
        updated_at = NOW()
    WHERE topic = lower(trim(from_code));

    GET DIAGNOSTICS v_lesson_count = ROW_COUNT;
  END IF;

  -- 5. Di chuyển Câu hỏi (questions) trong Transaction
  IF move_questions THEN
    UPDATE public.questions
    SET topic = lower(trim(to_code)),
        updated_at = NOW()
    WHERE topic = lower(trim(from_code));

    GET DIAGNOSTICS v_question_count = ROW_COUNT;
  END IF;

  -- 6. Trả về kết quả đếm chi tiết dưới dạng JSONB
  RETURN jsonb_build_object(
    'moved_vocab', v_vocab_count,
    'moved_lessons', v_lesson_count,
    'moved_questions', v_question_count
  );
END;
$$;

-- Phân quyền cho user đã đăng nhập gọi RPC function
GRANT EXECUTE ON FUNCTION public.move_topic_content(TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
