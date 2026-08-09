# 🧠 Bộ Mẫu Prompt Tạo Dữ Liệu Import cho DailyE

Hướng dẫn sử dụng AI (ChatGPT, Gemini, Claude) để tạo dữ liệu câu hỏi TOEIC, bài học & từ vựng cho hệ thống DailyE.

---

## 📌 Ba phương pháp Import

| Phương pháp | Ưu điểm | Dùng khi |
|---|---|---|
| **Cách 1: File Excel/CSV** | Import qua giao diện `/admin/import`, có validate từng dòng, preview trước khi lưu | Nhập câu hỏi hoặc từ vựng hàng loạt, dễ kiểm tra lỗi |
| **Cách 2: SQL INSERT** | Chạy trực tiếp trên Supabase SQL Editor, nhanh, có thể insert cả Lessons + liên kết `lesson_questions` | Nhập cả câu hỏi lẫn bài học, dữ liệu phức tạp hơn |
| **Cách 3: Thêm thủ công** | Vào `/admin/content` -> Tab tương ứng -> Nút "Thêm mới", điền form -> Lưu | Thêm/sửa 1-2 mục đơn lẻ |

---

## 🔑 Giá trị hợp lệ (Quan trọng — dùng cho cả 3 cách)

### Bảng `questions` (Câu hỏi TOEIC)
```
exam_part:       part1 | part2 | part3 | part4 | part5 | part6 | part7
correct_answer:  A | B | C | D
difficulty:      easy | medium | hard
status:          draft | published
level_tag:       350+ | 500+ | 650+ | 800+ (hoặc mã Level động xem tại /admin/taxonomy)
topic:           office | hr | finance | ... (hoặc mã Topic động xem tại /admin/taxonomy, cho phép ô trống NULL)
knowledge_tag:   (text tự do, phân cách bằng dấu phẩy trong Excel)
                 Ví dụ: "Chia động từ", "Từ loại", "Giới từ", "Từ vựng chủ đề Business"
```

### Bảng `lessons` (Bài học kiến thức)
```
skill:           vocabulary | grammar | listening | reading | strategy
level_tag:       350+ | 500+ | 650+ | 800+ (hoặc mã Level động xem tại /admin/taxonomy)
topic:           office | hr | finance | ... (hoặc mã Topic động xem tại /admin/taxonomy, NULL = nhóm Chung)
status:          draft | published
```

### Bảng `vocabulary_items` (Kho từ vựng Active Recall)
```
word_type:       n | v | adj | adv | phrase
level_tag:       350+ | 500+ | 650+ | 800+ (hoặc mã Level động xem tại /admin/taxonomy)
topic:           office | hr | meeting | finance | marketing | travel
                 shopping | production | technology | health | restaurant | real_estate
                 (hoặc các mã Topic đang active xem tại trang /admin/taxonomy)
status:          draft | published
UNIQUE:          (word, word_type, topic) — không được trùng bộ 3 này
```

---

## ═══════════════════════════════════════
## PHẦN A: TẠO CÂU HỎI TOEIC
## ═══════════════════════════════════════

## ═══════════════════════════════════════
## CÁCH 1: TẠO FILE EXCEL / CSV (Câu hỏi)
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
## CÁCH 2: TẠO CÂU LỆNH SQL INSERT (Câu hỏi & Bài học)
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

## ═══════════════════════════════════════
## PHẦN B: TẠO TỪ VỰNG ACTIVE RECALL (MỚI)
## ═══════════════════════════════════════

> [!IMPORTANT]
> Từ Phase 5B, hệ thống DailyE học từ vựng bằng **Active Recall** 
> (trắc nghiệm + ghép cặp tương tác) thay vì lật thẻ flashcard thụ động.
> Từ vựng được lưu trong bảng `vocabulary_items`, KHÔNG phải trong `lessons.content`.

### Cấu trúc cột bắt buộc trong file CSV Từ vựng

| Cột | Bắt buộc | Mô tả | Ví dụ | Quy tắc Validate |
|---|---|---|---|---|
| `word` | ✅ | Từ gốc tiếng Anh | `negotiate` | Không được rỗng |
| `word_type` | ✅ | Loại từ | `v` | Phải thuộc: `n`, `v`, `adj`, `adv`, `phrase` |
| `meaning_vi` | ✅ | Nghĩa tiếng Việt | `đàm phán, thương lượng` | Không được rỗng |
| `example` | ✅ | Câu ví dụ ngữ cảnh | `We need to negotiate...` | Không rỗng; Cảnh báo vàng nếu câu không chứa từ gốc |
| `example_blank` | ❌ | Câu ví dụ dạng điền từ | `We need to _____ the...` | Tùy chọn (dùng cho tính năng tương lai) |
| `topic` | ✅ | Mã chủ đề TOEIC | `office` | Phải thuộc 12 topic đóng trong `vocab_topics` |
| `level_tag` | ❌ | Mức độ TOEIC | `650+` | Mặc định `500+` nếu bỏ trống |
| `audio_url` | ❌ | URL file phát âm | `null` | Tùy chọn (dùng cho tính năng tương lai) |

**Ràng buộc UNIQUE**: Bộ 3 `(word, word_type, topic)` không được trùng trong file hoặc trong DB.

---

### PROMPT 4A: Tạo từ vựng theo Chủ đề (File CSV)

```
Bạn là chuyên gia dạy từ vựng TOEIC.

Hãy tạo 15 từ vựng TOEIC theo chủ đề "Human Resources" dạng bảng CSV 
với các cột sau (phân cách bằng dấu phẩy):
word, word_type, meaning_vi, example, example_blank, topic, level_tag, audio_url

QUY TẮC:
1. word: Từ tiếng Anh thường gặp trong đề TOEIC thực tế.
2. word_type: Loại từ, phải thuộc: n, v, adj, adv, phrase.
   Nếu 1 từ có nhiều loại từ (ví dụ "recruit" vừa n vừa v), 
   tạo 2 dòng riêng biệt với word_type khác nhau.
3. meaning_vi: Nghĩa tiếng Việt ngắn gọn, phân cách bằng dấu phẩy 
   nếu có nhiều nghĩa.
4. example: Câu ví dụ tiếng Anh hoàn chỉnh, ngữ cảnh công sở, 
   BẮT BUỘC chứa từ gốc trong câu.
5. example_blank: Câu ví dụ giống cột example nhưng thay từ gốc 
   bằng "_____".
6. topic: "hr" (mã chủ đề trong hệ thống DailyE).
   CÁC MÃ HỢP LỆ: office, hr, meeting, finance, marketing, travel, 
   shopping, production, technology, health, restaurant, real_estate.
7. level_tag: Phân bổ đa dạng trong "350+", "500+", "650+", "800+".
   - 350+: Từ rất cơ bản (ví dụ: job, work)
   - 500+: Từ phổ biến (ví dụ: position, employee)
   - 650+: Từ trung cấp (ví dụ: compensation, expertise)
   - 800+: Từ nâng cao (ví dụ: remuneration, attrition)
8. audio_url: Để trống (hệ thống chưa hỗ trợ audio).

PHÂN BỔ LEVEL: 3 từ 350+, 5 từ 500+, 4 từ 650+, 3 từ 800+.

Xuất kết quả dạng bảng CSV (có dòng header), để tôi tải lên trang 
/admin/import -> Tab "Import Từ vựng TOEIC".
```

---

### PROMPT 4B: Tạo từ vựng hàng loạt nhiều Chủ đề (File CSV)

```
Bạn là chuyên gia dạy từ vựng TOEIC.

Hãy tạo 40 từ vựng TOEIC dạng bảng CSV cho 4 chủ đề, mỗi chủ đề 10 từ:
- meeting (📋 Họp & Sự kiện)
- shopping (🛒 Mua sắm & Dịch vụ)
- technology (💻 Công nghệ)
- health (🏥 Sức khỏe)

Các cột: word, word_type, meaning_vi, example, example_blank, topic, level_tag, audio_url

QUY TẮC:
1. topic: Phải là mã chủ đề tương ứng (meeting/shopping/technology/health).
2. Mỗi chủ đề 10 từ: 2 từ 350+, 3 từ 500+, 3 từ 650+, 2 từ 800+.
3. word_type: Đa dạng trong n, v, adj, adv, phrase. 
   Ưu tiên n và v (chiếm 70%).
4. example: Câu hoàn chỉnh có ngữ cảnh TOEIC, BẮT BUỘC chứa từ gốc.
5. example_blank: Câu giống example nhưng từ gốc thay bằng "_____".
6. KHÔNG được trùng bộ (word, word_type, topic).
7. audio_url: Để trống.

Xuất kết quả CSV có dòng header, gộp tất cả 40 từ trong 1 file.
```

---

### PROMPT 4C: Tạo từ vựng (SQL INSERT)

```
Bạn là chuyên gia dạy từ vựng TOEIC và chuyên gia PostgreSQL.

Hãy tạo câu lệnh SQL INSERT INTO cho bảng public.vocabulary_items 
với 20 từ vựng TOEIC chủ đề "Marketing & Sales".

CẤU TRÚC BẢNG:
CREATE TABLE public.vocabulary_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  word TEXT NOT NULL,
  word_type TEXT CHECK (word_type IN ('n', 'v', 'adj', 'adv', 'phrase')),
  meaning_vi TEXT NOT NULL,
  example TEXT,
  example_blank TEXT,
  topic TEXT NOT NULL REFERENCES public.vocab_topics(code),
  level_tag TEXT,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' 
    CHECK (status IN ('draft', 'published')),
  CONSTRAINT uq_vocabulary_items_word_type_topic 
    UNIQUE (word, word_type, topic)
);

QUY TẮC:
1. KHÔNG cần cột id (tự sinh BIGINT), created_at (có DEFAULT).
2. topic: 'marketing' (mã chủ đề hệ thống).
3. word_type: Đa dạng n, v, adj, adv. Ưu tiên n và v.
4. example: Câu ví dụ tiếng Anh BẮT BUỘC chứa từ gốc, 
   ngữ cảnh kinh doanh thực tế.
5. example_blank: Câu giống example nhưng thay từ gốc bằng "_____".
6. level_tag: Phân bổ 4 từ '350+', 7 từ '500+', 5 từ '650+', 4 từ '800+'.
7. status: 'published' (để dùng ngay).
8. KHÔNG được trùng bộ (word, word_type, topic).
9. Sử dụng ON CONFLICT (word, word_type, topic) DO UPDATE SET ... 
   để an toàn khi chạy lại.

Xuất 1 câu lệnh INSERT INTO ... VALUES (...), (...), ...
ON CONFLICT ... DO UPDATE SET ...;
để tôi chạy trên Supabase SQL Editor.
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

### Cách 1: File Excel (Câu hỏi TOEIC)
```
1. Copy prompt 1A/1B/1C → Paste vào ChatGPT/Gemini/Claude
2. AI trả kết quả dạng bảng → Copy vào Google Sheets / Excel
3. Lưu file .xlsx
4. Vào /admin/import → Tab "Import Câu hỏi TOEIC" → Upload → Preview → Commit
5. Vào /admin/content → Tab "Câu hỏi TOEIC" → Đổi status thành Published
```

### Cách 2: File CSV (Từ vựng Active Recall)
```
1. Copy prompt 4A/4B → Paste vào ChatGPT/Gemini/Claude
2. AI trả kết quả CSV → Lưu file .csv (hoặc copy vào Google Sheets rồi Save As .csv)
3. Vào /admin/import → Tab "Import Từ vựng TOEIC" → Upload → Preview dòng Xanh/Vàng/Đỏ → Commit
4. Vào /admin/content → Tab "Từ vựng Active Recall" → Đổi status thành Published
5. Từ vựng xuất hiện ngay trên /learn/vocabulary cho học viên
```

### Cách 3: SQL trực tiếp
```
1. Copy prompt 2A/2B/2C (câu hỏi & bài học) hoặc 4C (từ vựng) → Paste vào AI
2. AI trả câu lệnh SQL → Copy
3. Vào Supabase Dashboard → SQL Editor → Paste → Run
4. Dữ liệu được insert trực tiếp vào DB (đã set published)
```

> [!TIP]
> **Mẹo**: Khi tạo batch lớn (50+ câu hoặc 30+ từ vựng), nên chia thành 
> nhiều lần prompt (mỗi lần 15-20 mục) để AI giữ được chất lượng nội dung 
> ổn định. Nhớ thay đổi dải code hoặc chọn topic khác để tránh trùng 
> UNIQUE constraint `(word, word_type, topic)`.
