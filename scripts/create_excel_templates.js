const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const publicTemplatesDir = path.join(__dirname, '..', 'public', 'templates');

// 1. Tạo dailye_lesson_questions_template.xlsx
const lessonQuestionsData = [
  { lesson_slug: 'bai-hoc-ngu-phap-thi-hien-tai-hoan-thanh', question_code: 'P5-0001', order_index: 1 },
  { lesson_slug: 'bai-hoc-ngu-phap-thi-hien-tai-hoan-thanh', question_code: 'P5-0002', order_index: 2 },
  { lesson_slug: 'tu-vung-toeic-chu-de-van-phong-hop-hanh', question_code: 'P5-0003', order_index: 1 },
  { lesson_slug: 'tu-vung-toeic-chu-de-van-phong-hop-hanh', question_code: 'P5-0004', order_index: 2 },
  { lesson_slug: 'tu-vung-toeic-chu-de-van-phong-hop-hanh', question_code: 'P5-0005', order_index: 3 },
  { lesson_slug: 'invalid-lesson-slug-test-12345', question_code: 'P5-0001', order_index: 1 },
  { lesson_slug: 'bai-hoc-ngu-phap-thi-hien-tai-hoan-thanh', question_code: 'INVALID-QUESTION-CODE-9999', order_index: 1 },
];

const wbLQ = XLSX.utils.book_new();
const wsLQ = XLSX.utils.json_to_sheet(lessonQuestionsData);
XLSX.utils.book_append_sheet(wbLQ, wsLQ, 'lesson_questions');
XLSX.writeFile(wbLQ, path.join(publicTemplatesDir, 'dailye_lesson_questions_template.xlsx'));
console.log('✅ Đã tạo dailye_lesson_questions_template.xlsx thành công');

// 2. Tạo dailye_tests_template.xlsx (2 Sheets: tests & test_questions)
const testsData = [
  {
    test_code: 'MT-001',
    title: 'Đề Thi Thử Mini Test 01 - Ôn Tập Ngữ Pháp & Từ Vựng',
    test_type: 'mini',
    time_limit_minutes: 20,
  },
];

const testQuestionsData = [
  { test_code: 'MT-001', question_code: 'P5-0001', order_index: 1 },
  { test_code: 'MT-001', question_code: 'P5-0002', order_index: 2 },
  { test_code: 'MT-001', question_code: 'P5-0003', order_index: 3 },
  { test_code: 'MT-001', question_code: 'P5-0004', order_index: 4 },
  { test_code: 'MT-001', question_code: 'P5-0005', order_index: 5 },
  { test_code: 'MT-001', question_code: 'P5-0006', order_index: 6 },
  { test_code: 'MT-001', question_code: 'P5-0007', order_index: 7 },
  { test_code: 'MT-001', question_code: 'P5-0008', order_index: 8 },
  { test_code: 'MT-001', question_code: 'P5-0009', order_index: 9 },
  { test_code: 'MT-001', question_code: 'P5-0010', order_index: 10 },
  { test_code: 'MT-001', question_code: 'NON_EXISTENT_QUESTION_CODE_9999', order_index: 11 },
];

const wbTests = XLSX.utils.book_new();
const wsTests = XLSX.utils.json_to_sheet(testsData);
const wsTQ = XLSX.utils.json_to_sheet(testQuestionsData);

XLSX.utils.book_append_sheet(wbTests, wsTests, 'tests');
XLSX.utils.book_append_sheet(wbTests, wsTQ, 'test_questions');
XLSX.writeFile(wbTests, path.join(publicTemplatesDir, 'dailye_tests_template.xlsx'));
console.log('✅ Đã tạo dailye_tests_template.xlsx thành công');
