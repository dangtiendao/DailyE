# 🧠 Bộ Mẫu Prompt Tạo Dữ Liệu Import cho DailyE

Hướng dẫn sử dụng AI (ChatGPT, Gemini, Claude) để tạo dữ liệu câu hỏi TOEIC & bài học cho hệ thống DailyE.

---

## 📌 Hai phương pháp Import

| Phương pháp | Ưu điểm | Dùng khi |
|---|---|---|
| **Cách 1: File Excel/CSV** | Import qua giao diện `/admin/import`, có validate từng dòng, preview trước khi lưu | Nhập câu hỏi hàng loạt, dễ kiểm tra lỗi |
| **Cách 2: SQL INSERT** | Chạy trực tiếp trên Supabase SQL Editor, nhanh, có thể insert cả Lessons + liên kết `lesson_questions` | Nhập cả câu hỏi lẫn bài học, dữ liệu phức tạp hơn |

---

## 🔑 Giá trị hợp lệ (Quan trọng — dùng cho cả 2 cách)

```
exam_part:       part1 | part2 | part3 | part4 | part5 | part6 | part7
correct_answer:  A | B | C | D
difficulty:      easy | medium | hard
status:          draft | published
skill (lessons): vocabulary | grammar | listening | reading | strategy
knowledge_tag:   (text tự do, phân cách bằng dấu phẩy trong Excel)
                 Ví dụ: "Chia động từ", "Từ loại", "Giới từ", "Từ vựng chủ đề Business"
```

---

## ═══════════════════════════════════════
## CÁCH 1: TẠO FILE EXCEL / CSV
## ═══════════════════════════════════════

### Cấu trúc cột bắt buộc trong file Excel

| Cột | Bắt buộc | Mô tả | Ví dụ |
|---|---|---|---|
| `code` | ✅ | Mã câu hỏi, **duy nhất** | `P5-0001` |
| `exam_part` | ✅ | Part bài thi | `part5` |
| `question_text` | ✅ | Nội dung đề bài | `The manager ___ the report...` |
| `optionA` | ✅ | Lựa chọn A | `reviewed` |
| `optionB` | ✅ | Lựa chọn B | `reviews` |
| `optionC` | ✅ | Lựa chọn C | `reviewing` |
| `optionD` | ✅ | Lựa chọn D | `to review` |
| `correct_answer` | ✅ | Đáp án đúng | `A` |
| `explanation` | ❌ | Giải thích đáp án | `"reviewed" là V2 phù hợp...` |
| `knowledge_tag` | ❌ | Chủ điểm (phẩy phân cách) | `Chia động từ, Thì quá khứ` |
| `topic` | ❌ | Chủ đề ngữ cảnh | `Business Meeting` |
| `difficulty` | ❌ | Độ khó (mặc định `medium`) | `easy` |
| `image_url` | ❌ | URL hình ảnh (Part 1) | `null` |
| `audio_url` | ❌ | URL file audio (Part 3/4) | `null` |

---

### PROMPT 1A: Tạo câu hỏi Part 5 (Excel)

```
Bạn là chuyên gia soạn đề TOEIC Reading Part 5 (Incomplete Sentences).

Hãy tạo 20 câu hỏi TOEIC Part 5 dạng bảng CSV với các cột sau (phân cách bằng dấu tab):
code | exam_part | question_text | optionA | optionB | optionC | optionD | correct_answer | explanation | knowledge_tag | topic | difficulty

QUY TẮC:
1. code: Đánh mã từ P5-0001 đến P5-0020, KHÔNG trùng nhau.
2. exam_part: luôn là "part5".
3. question_text: Câu tiếng Anh hoàn chỉnh có 1 chỗ trống "___", 
   mô phỏng ngữ cảnh công sở/thương mại thực tế.
4. 4 lựa chọn A/B/C/D phải hợp lý, có tính nhiễu cao, 
   chỉ 1 đáp án đúng duy nhất.
5. explanation: Giải thích ngắn gọn bằng tiếng Việt tại sao 
   đáp án đúng và tại sao các đáp án sai bị loại.
6. knowledge_tag: Phân loại chủ điểm ngữ pháp/từ vựng. 
   Ví dụ: "Từ loại", "Chia động từ", "Giới từ", "Liên từ", 
   "Từ vựng chủ đề Business", "Đại từ quan hệ", "So sánh".
7. difficulty: Phân bổ 7 câu easy, 8 câu medium, 5 câu hard.
8. topic: Chủ đề ngữ cảnh như "Office", "Finance", 
   "Human Resources", "Marketing", "Travel".

Xuất kết quả dạng bảng để tôi copy-paste vào file Excel.
```

---

### PROMPT 1B: Tạo câu hỏi Part 6 (Excel)

```
Bạn là chuyên gia soạn đề TOEIC Reading Part 6 (Text Completion).

Hãy tạo 8 câu hỏi TOEIC Part 6 dạng bảng CSV với các cột:
code | exam_part | question_text | optionA | optionB | optionC | optionD | correct_answer | explanation | knowledge_tag | topic | difficulty

QUY TẮC:
1. code: Đánh mã từ P6-0001 đến P6-0008.
2. exam_part: luôn là "part6".
3. question_text: Đoạn văn ngắn (email/thông báo/memo) 
   có 1 chỗ trống "___". Mỗi câu là 1 đoạn văn riêng biệt
   dài 2-4 câu.
4. Câu hỏi phải kiểm tra khả năng hiểu ngữ cảnh đoạn văn 
   để chọn từ/cụm từ phù hợp.
5. knowledge_tag: "Từ vựng ngữ cảnh", "Liên từ nối câu", 
   "Thì động từ trong đoạn văn", "Từ loại".
6. difficulty: 3 easy, 3 medium, 2 hard.
7. topic: "Email", "Memo", "Notice", "Advertisement".

Xuất kết quả dạng bảng để tôi copy-paste vào file Excel.
```

---

### PROMPT 1C: Tạo câu hỏi Part 7 (Excel)

```
Bạn là chuyên gia soạn đề TOEIC Reading Part 7 (Reading Comprehension).

Hãy tạo 10 câu hỏi TOEIC Part 7 dạng bảng CSV với các cột:
code | exam_part | question_text | optionA | optionB | optionC | optionD | correct_answer | explanation | knowledge_tag | topic | difficulty

QUY TẮC:
1. code: Đánh mã từ P7-0001 đến P7-0010.
2. exam_part: luôn là "part7".
3. question_text: Gồm 2 phần ngăn cách bằng dòng "---":
   - Phần 1 (trước ---): Đoạn đọc hiểu (email/quảng cáo/bài báo) 
     dài 4-8 câu.
   - Phần 2 (sau ---): Câu hỏi về nội dung đoạn đọc.
   Ví dụ:
   "Dear Mr. Thompson, We are pleased to inform you that your 
   application for the marketing position has been approved. 
   Please report to our headquarters on Monday at 9 AM. 
   Sincerely, HR Department
   ---
   What is the purpose of this letter?"
4. 4 lựa chọn phải hợp lý với nội dung bài đọc.
5. knowledge_tag: "Đọc hiểu chi tiết", "Suy luận", 
   "Tìm thông tin cụ thể", "Mục đích bài đọc".
6. difficulty: 3 easy, 4 medium, 3 hard.

Xuất kết quả dạng bảng để tôi copy-paste vào file Excel.
```

---

## ═══════════════════════════════════════
## CÁCH 2: TẠO CÂU LỆNH SQL INSERT
## ═══════════════════════════════════════

### PROMPT 2A: Tạo câu hỏi Part 5 (SQL)

```
Bạn là chuyên gia soạn đề TOEIC và chuyên gia PostgreSQL.

Hãy tạo câu lệnh SQL INSERT INTO cho bảng public.questions 
với 20 câu hỏi TOEIC Part 5 (Incomplete Sentences).

CẤU TRÚC BẢNG:
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  exam_part TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  knowledge_tag TEXT[] DEFAULT '{}',
  topic TEXT,
  difficulty TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'draft'
);

QUY TẮC:
1. KHÔNG cần cột id (tự sinh UUID), created_at, updated_at (có DEFAULT).
2. code: Đánh mã P5-0001 đến P5-0020, UNIQUE.
3. exam_part: 'part5'.
4. options: Định dạng JSONB '{"A":"...","B":"...","C":"...","D":"..."}'.
5. correct_answer: Chỉ 'A', 'B', 'C', hoặc 'D'.
6. knowledge_tag: Mảng TEXT PostgreSQL, ví dụ ARRAY['Từ loại','Chia động từ'].
7. difficulty: Phân bổ 7 'easy', 8 'medium', 5 'hard'.
8. status: 'published' (để dùng ngay).
9. explanation: Giải thích ngắn gọn bằng tiếng Việt.
10. Câu hỏi phải sát format TOEIC thực tế, ngữ cảnh công sở/thương mại.

Xuất kết quả là 1 câu lệnh INSERT INTO ... VALUES (...), (...), ...;
để tôi chạy trên Supabase SQL Editor.
```

---

### PROMPT 2B: Tạo câu hỏi Part 6 & Part 7 (SQL)

```
Bạn là chuyên gia soạn đề TOEIC và chuyên gia PostgreSQL.

Hãy tạo câu lệnh SQL INSERT INTO cho bảng public.questions 
gồm 8 câu Part 6 (Text Completion) và 10 câu Part 7 (Reading Comprehension).

CẤU TRÚC BẢNG (giống Prompt 2A ở trên).

QUY TẮC Part 6:
- code: P6-0001 đến P6-0008, exam_part: 'part6'.
- question_text: Đoạn văn ngắn (email/memo) có 1 chỗ trống "___".
- knowledge_tag: ARRAY['Từ vựng ngữ cảnh'] hoặc ARRAY['Liên từ nối câu'].

QUY TẮC Part 7:
- code: P7-0001 đến P7-0010, exam_part: 'part7'.
- question_text: Đoạn đọc hiểu dài 4-8 câu + dòng phân cách "---" 
  + câu hỏi ở phía dưới.
- knowledge_tag: ARRAY['Đọc hiểu chi tiết'] hoặc ARRAY['Suy luận'].

Chung:
- status: 'published'.
- difficulty: Phân bổ đều easy/medium/hard.
- explanation: Giải thích bằng tiếng Việt.

Xuất 1 câu lệnh INSERT INTO duy nhất chứa tất cả 18 dòng VALUES.
```

---

### PROMPT 2C: Tạo bài học Lessons (SQL)

```
Bạn là chuyên gia dạy TOEIC và chuyên gia PostgreSQL.

Hãy tạo câu lệnh SQL INSERT INTO cho bảng public.lessons 
với 6 bài học kiến thức TOEIC.

CẤU TRÚC BẢNG:
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  skill TEXT NOT NULL,
  level_tag TEXT,
  status TEXT DEFAULT 'draft',
  order_index INTEGER DEFAULT 0
);

QUY TẮC:
1. Tạo 6 bài học với phân bổ skill:
   - 2 bài skill='vocabulary' (Từ vựng chủ đề Office, Finance)
   - 2 bài skill='grammar' (Chia động từ, Từ loại)
   - 1 bài skill='strategy' (Chiến thuật Part 5)
   - 1 bài skill='reading' (Kỹ năng Đọc hiểu Part 7)
2. slug: Dạng kebab-case, UNIQUE. Ví dụ: "tu-vung-office".
3. content: Viết bằng Markdown đầy đủ, gồm:
   - Tiêu đề ## và ###
   - Danh sách từ vựng/ngữ pháp dạng bảng Markdown
   - Ví dụ câu minh họa kèm bản dịch
   - Mẹo ghi nhớ hoặc quy tắc áp dụng
   - Độ dài tối thiểu 300 từ/bài.
4. level_tag: "A2", "B1", "B2" phân bổ đa dạng.
5. status: 'published'.
6. order_index: Đánh số từ 1 đến 6.

Xuất 1 câu lệnh INSERT INTO ... VALUES (...), (...), ...;
```

---

### PROMPT 2D: Tạo Vocabulary Flashcards (SQL)

```
Bạn là chuyên gia dạy từ vựng TOEIC và chuyên gia PostgreSQL.

Hệ thống DailyE lưu flashcards trong bảng lessons với skill='vocabulary'.
Nội dung thẻ flashcard nằm trong cột content (Markdown).

Hãy tạo 1 bài học từ vựng có 15 từ theo chủ đề "Human Resources" 
với format Markdown sau trong cột content:

---
## 📖 Từ vựng: Human Resources

| # | Từ vựng | Phiên âm | Nghĩa | Ví dụ |
|---|---------|----------|-------|-------|
| 1 | recruit | /rɪˈkruːt/ | tuyển dụng | The company is recruiting new staff. |
| 2 | ... | ... | ... | ... |

### 💡 Mẹo ghi nhớ
- **recruit** → "re + cruit" = tìm lại người mới
- ...
---

QUY TẮC:
1. 15 từ vựng sát TOEIC, xuất hiện nhiều trong đề thi thật.
2. Mỗi từ có: phiên âm IPA, nghĩa tiếng Việt, 1 câu ví dụ 
   trong ngữ cảnh công sở.
3. Phần Mẹo ghi nhớ: Tối thiểu 5 từ có mẹo.
4. slug: "tu-vung-human-resources"
5. skill: 'vocabulary', level_tag: 'B1', status: 'published'.

Xuất SQL INSERT INTO public.lessons VALUES (...);
```

---

## 🔄 Prompt Nâng Cao: Tạo dữ liệu hàng loạt (Batch)

### PROMPT 3: Tạo 50 câu hỏi hỗn hợp Part 5/6/7

```
Bạn là chuyên gia soạn đề TOEIC. Hãy tạo DỮ LIỆU SQL INSERT 
cho bảng public.questions gồm 50 câu hỏi:

- 30 câu Part 5 (code: P5-0021 đến P5-0050)
- 10 câu Part 6 (code: P6-0009 đến P6-0018)
- 10 câu Part 7 (code: P7-0011 đến P7-0020)

PHÂN BỔ CHỦ ĐIỂM (knowledge_tag):
- Chia động từ (Tenses): 8 câu
- Từ loại (Parts of Speech): 8 câu
- Giới từ (Prepositions): 6 câu
- Liên từ (Conjunctions): 5 câu
- Từ vựng Business: 8 câu
- Đại từ quan hệ: 5 câu
- Đọc hiểu / Suy luận: 10 câu

PHÂN BỔ ĐỘ KHÓ:
- easy: 15 câu | medium: 20 câu | hard: 15 câu

CẤU TRÚC BẢNG:
(giống các prompt trên)

QUY TẮC BẮT BUỘC:
1. Tất cả status = 'published'.
2. Mỗi câu PHẢI có explanation bằng tiếng Việt.
3. Code KHÔNG được trùng nhau.
4. Ngữ cảnh câu hỏi đa dạng: Office, Finance, Marketing, 
   Travel, Manufacturing, Retail.
5. Part 7: question_text có đoạn đọc + "---" + câu hỏi.

Xuất 1 lệnh INSERT INTO duy nhất cho tất cả 50 dòng.
```

---

## ⚡ Quy trình sử dụng nhanh

### Cách 1: File Excel
```
1. Copy prompt 1A/1B/1C → Paste vào ChatGPT/Gemini/Claude
2. AI trả kết quả dạng bảng → Copy vào Google Sheets / Excel
3. Lưu file .xlsx
4. Vào /admin/import → Upload file → Preview → Commit Import
5. Vào /admin/content → Đổi status thành Published
```

### Cách 2: SQL
```
1. Copy prompt 2A/2B/2C/2D → Paste vào ChatGPT/Gemini/Claude
2. AI trả câu lệnh SQL → Copy
3. Vào Supabase Dashboard → SQL Editor → Paste → Run
4. Dữ liệu được insert trực tiếp vào DB (đã set published)
```

> [!TIP]
> **Mẹo**: Khi tạo batch lớn (50+ câu), nên chia thành nhiều lần prompt 
> (mỗi lần 20-30 câu) để AI giữ được chất lượng nội dung ổn định.
> Nhớ thay đổi dải code (P5-0051 đến P5-0070...) để tránh trùng.
