-- ==============================================================================
-- SCRIPT SEED_VOCAB_TEST.SQL: GIEO DỮ LIỆU TỪ VỰNG TEST HỆ THỐNG DAILYE
-- Mô tả: Chèn 25 từ vựng ở trạng thái 'published' cho 3 chủ đề:
--  - office: 12 từ (Đủ cho Matching & MCQ cùng topic)
--  - travel: 10 từ (Đủ cho phiên học từ mới)
--  - finance: 3 từ (CỐ TÌNH ÍT - để test fallback distractor cùng level khác topic)
-- ==============================================================================

INSERT INTO public.vocabulary_items (word, word_type, meaning_vi, example, example_blank, topic, level_tag, status) VALUES
  -- 1. CHỦ ĐỀ OFFICE (12 từ)
  ('negotiate', 'v', 'đàm phán, thương lượng', 'We need to negotiate the contract terms with the supplier.', 'We need to _____ the contract terms with the supplier.', 'office', '650+', 'published'),
  ('schedule', 'v', 'lên lịch trình', 'The interview is scheduled for next Monday at 9 AM.', 'The interview is _____ for next Monday at 9 AM.', 'office', '500+', 'published'),
  ('policy', 'n', 'chính sách, quy định', 'Employees must strictly follow the company security policy.', 'Employees must strictly follow the company security _____.', 'office', '500+', 'published'),
  ('contract', 'n', 'hợp đồng', 'Both parties signed the agreement contract this morning.', 'Both parties signed the agreement _____ this morning.', 'office', '500+', 'published'),
  ('executive', 'n', 'cán bộ quản lý cao cấp', 'The chief executive officer announced the quarterly results.', 'The chief _____ officer announced the quarterly results.', 'office', '800+', 'published'),
  ('procedure', 'n', 'quy trình, thủ tục', 'Please follow the standard safety procedure.', 'Please follow the standard safety _____.', 'office', '650+', 'published'),
  ('collaborate', 'v', 'hợp tác, phối hợp', 'Teams must collaborate to complete the project on time.', 'Teams must _____ to complete the project on time.', 'office', '650+', 'published'),
  ('delegate', 'v', 'phân công, ủy nhiệm', 'Managers should delegate tasks to team members.', 'Managers should _____ tasks to team members.', 'office', '750+', 'published'),
  ('facility', 'n', 'cơ sở vật chất, trang thiết bị', 'Our manufacturing facility operates 24 hours a day.', 'Our manufacturing _____ operates 24 hours a day.', 'office', '500+', 'published'),
  ('equipment', 'n', 'thiết bị, dụng cụ', 'All office equipment was inspected last week.', 'All office _____ was inspected last week.', 'office', '500+', 'published'),
  ('supervisor', 'n', 'người giám sát', 'Your supervisor will review your performance next week.', 'Your _____ will review your performance next week.', 'office', '500+', 'published'),
  ('document', 'n', 'tài liệu, văn bản', 'Please sign the document before sending it to HR.', 'Please sign the _____ before sending it to HR.', 'office', '500+', 'published'),

  -- 2. CHỦ ĐỀ TRAVEL (10 từ)
  ('itinerary', 'n', 'lịch trình chuyến đi', 'The travel agency sent us a detailed tour itinerary.', 'The travel agency sent us a detailed tour _____.', 'travel', '650+', 'published'),
  ('reservation', 'n', 'sự đặt chỗ trước', 'I made a hotel reservation for three nights in Tokyo.', 'I made a hotel _____ for three nights in Tokyo.', 'travel', '500+', 'published'),
  ('destination', 'n', 'điểm đến', 'Paris is a popular tourist destination in Europe.', 'Paris is a popular tourist _____ in Europe.', 'travel', '500+', 'published'),
  ('accommodation', 'n', 'chỗ ở, nơi lưu trú', 'The conference package includes luxury accommodation.', 'The conference package includes luxury _____.', 'travel', '650+', 'published'),
  ('departure', 'n', 'sự khởi hành, chuyến bay đi', 'Please check the departure board for flight updates.', 'Please check the _____ board for flight updates.', 'travel', '500+', 'published'),
  ('delay', 'v', 'trì hoãn, chậm trễ', 'Bad weather may delay our flight by two hours.', 'Bad weather may _____ our flight by two hours.', 'travel', '500+', 'published'),
  ('baggage', 'n', 'hành lý', 'Passengers are allowed two pieces of carry-on baggage.', 'Passengers are allowed two pieces of carry-on _____.', 'travel', '500+', 'published'),
  ('shuttle', 'n', 'xe buýt đưa đón ngắn chặng', 'The hotel provides a complimentary airport shuttle service.', 'The hotel provides a complimentary airport _____ service.', 'travel', '650+', 'published'),
  ('inconvenience', 'n', 'sự bất tiện', 'We apologize for any inconvenience caused by the delay.', 'We apologize for any _____ caused by the delay.', 'travel', '750+', 'published'),
  ('confirm', 'v', 'xác nhận chuyến đi', 'Please confirm your flight details 24 hours in advance.', 'Please _____ your flight details 24 hours in advance.', 'travel', '500+', 'published'),

  -- 3. CHỦ ĐỀ FINANCE (3 từ - CỐ TÌNH ÍT ĐỂ TEST FALLBACK DISTRACTOR)
  ('revenue', 'n', 'doanh thu', 'Quarterly revenue increased by 15 percent.', 'Quarterly _____ increased by 15 percent.', 'finance', '650+', 'published'),
  ('budget', 'n', 'ngân sách', 'The department exceeded its annual budget.', 'The department exceeded its annual _____.', 'finance', '500+', 'published'),
  ('quarterly', 'adj', 'hàng quý (3 tháng/lần)', 'The quarterly financial report will be published tomorrow.', 'The _____ financial report will be published tomorrow.', 'finance', '650+', 'published')
ON CONFLICT (word, word_type, topic) DO UPDATE SET
  meaning_vi = EXCLUDED.meaning_vi,
  example = EXCLUDED.example,
  example_blank = EXCLUDED.example_blank,
  level_tag = EXCLUDED.level_tag,
  status = 'published';
