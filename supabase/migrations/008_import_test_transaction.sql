-- Migration 008: Stored Procedure cho phép Import/Overwrite Đề thi nguyên tử trong 1 Transaction Block

CREATE OR REPLACE FUNCTION public.import_test_with_questions(
  p_title TEXT,
  p_test_type TEXT,
  p_time_limit_minutes INTEGER,
  p_questions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_test_id UUID;
  v_elem JSONB;
  v_question_id UUID;
  v_order_index INTEGER;
  v_inserted_count INTEGER := 0;
BEGIN
  -- 1. Kiểm tra tồn tại test theo title
  SELECT id INTO v_test_id
  FROM public.tests
  WHERE LOWER(title) = LOWER(p_title)
  LIMIT 1;

  IF v_test_id IS NOT NULL THEN
    -- Update test metadata
    UPDATE public.tests
    SET
      test_type = p_test_type,
      time_limit_minutes = p_time_limit_minutes,
      updated_at = NOW()
    WHERE id = v_test_id;

    -- Xóa danh sách câu hỏi cũ để đè mới
    DELETE FROM public.test_questions
    WHERE test_id = v_test_id;
  ELSE
    -- Insert test mới với status = 'draft'
    INSERT INTO public.tests (title, test_type, time_limit_minutes, status)
    VALUES (p_title, p_test_type, p_time_limit_minutes, 'draft')
    RETURNING id INTO v_test_id;
  END IF;

  -- 2. Duyệt danh sách questions từ p_questions (mảng JSONB: [{"question_id": "...", "order_index": 1}, ...])
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    v_question_id := (v_elem->>'question_id')::UUID;
    v_order_index := (v_elem->>'order_index')::INTEGER;

    INSERT INTO public.test_questions (test_id, question_id, order_index)
    VALUES (v_test_id, v_question_id, v_order_index);

    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'test_id', v_test_id,
    'inserted_questions', v_inserted_count
  );

EXCEPTION WHEN OTHERS THEN
  -- Nếu bất kỳ lệnh nào trong block bị lỗi, toàn bộ transaction tự động ROLLBACK 100%
  RAISE EXCEPTION 'Lỗi import đề thi "%": %', p_title, SQLERRM;
END;
$$;
