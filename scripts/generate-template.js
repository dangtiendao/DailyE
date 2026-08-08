const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Mẫu dữ liệu 3 câu hỏi Part 5 TOEIC thực tế
const templateData = [
  {
    code: 'P5-0001',
    exam_part: 'part5',
    question_text: 'The marketing team has proposed a new strategy to ------- customer engagement.',
    optionA: 'increase',
    optionB: 'increasing',
    optionC: 'increased',
    optionD: 'increasingly',
    correct_answer: 'A',
    explanation: 'Sau động từ nguyên mẫu "to" cần một động từ nguyên thể (V-bare) làm bổ ngữ. Đáp án đúng là (A) increase.',
    knowledge_tag: 'Grammar, Parts of Speech, To-Infinitive',
    topic: 'Business Strategy',
    difficulty: 'medium',
    image_url: '',
    audio_url: ''
  },
  {
    code: 'P5-0002',
    exam_part: 'part5',
    question_text: 'All employees are required to submit their monthly expense reports ------- Friday afternoon.',
    optionA: 'on',
    optionB: 'by',
    optionC: 'at',
    optionD: 'for',
    correct_answer: 'B',
    explanation: 'Giới từ "by" được dùng chỉ hạn chót (trước hoặc tại một thời điểm nào đó). Đáp án đúng là (B) by.',
    knowledge_tag: 'Grammar, Prepositions',
    topic: 'Office Management',
    difficulty: 'easy',
    image_url: '',
    audio_url: ''
  },
  {
    code: 'P5-0003',
    exam_part: 'part5',
    question_text: 'The newly appointed director is highly ------- for her innovative management style.',
    optionA: 'respect',
    optionB: 'respected',
    optionC: 'respecting',
    optionD: 'respectfully',
    correct_answer: 'B',
    explanation: 'Cấu trúc bị động "is highly + V3/ed". "respected" có nghĩa là được tôn trọng/đánh giá cao.',
    knowledge_tag: 'Grammar, Passive Voice, Adjectives',
    topic: 'Human Resources',
    difficulty: 'hard',
    image_url: '',
    audio_url: ''
  }
];

const worksheet = XLSX.utils.json_to_sheet(templateData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

const dir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const filePath = path.join(dir, 'dailye_questions_template.xlsx');
XLSX.writeFile(workbook, filePath);
console.log('Successfully generated template file at:', filePath);
