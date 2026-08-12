# 🧠 Bộ Mẫu Prompt Tạo Dữ Liệu Import Chuẩn cho DailyE (Version 3.0 - Phase 5E)

Tài liệu này tổng hợp toàn bộ các mẫu Prompt chuẩn hóa dành cho AI (ChatGPT, Gemini, Claude) để sinh dữ liệu **Taxonomy**, **Từ vựng Active Recall**, **Câu hỏi TOEIC (Part 5/6/7 & Đề thi cố định)**, **Bài học Markdown (.md)** và **Quy trình QA Soát lỗi dữ liệu** cho hệ thống DailyE.

---

## 📌 Tổng quan Các Luồng Import Hỗ trợ

| Nội dung | Định dạng file | Vị trí Import | Số cột / Cấu trúc bắt buộc |
|---|---|---|---|
| **1. Taxonomy** | Excel 2 Sheets (`topics`, `levels`) | `/admin/import` $\rightarrow$ Tab 6 | `topics` (4 cột: `code,display_name,description,order_index`)<br>`levels` (3 cột: `code,display_name,order_index`) |
| **2. Từ vựng Active Recall** | File CSV / Excel | `/admin/import` $\rightarrow$ Tab 2 | 8 cột: `word,word_type,meaning_vi,example,example_blank,topic,level_tag,audio_url` |
| **3. Câu hỏi TOEIC** | File Excel / CSV | `/admin/import` $\rightarrow$ Tab 1 | 18 cột: `question_code,exam_part,question_type,level_tag,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,knowledge_tag,topic,difficulty,audio_url,transcript,source_id,status` |
| **4. Bài học Kiến thức** | File `.md` (Multi-file) | `/admin/import` $\rightarrow$ Tab 3 | YAML Frontmatter (`title`, `slug`, `skill`, `level_tag`, `topic`, `order_index`) + Thân bài Markdown |
| **5. Liên kết Bài học ↔ Câu hỏi** | File Excel / CSV | `/admin/import` $\rightarrow$ Tab 4 | 3 cột: `lesson_slug,question_code,order_index` |
| **6. Đề thi TOEIC Cố định** | Excel 2 Sheets (`tests`, `test_questions`) | `/admin/import` $\rightarrow$ Tab 5 | `tests` (4 cột: `test_code,title,test_type,time_limit_minutes`)<br>`test_questions` (3 cột: `test_code,question_code,order_index`) |

---

## 🔑 Danh mục Giá trị Hợp lệ (Closed Categories)

- **`topic`**: `office`, `hr`, `meeting`, `finance`, `marketing`, `travel`, `shopping`, `production`, `technology`, `health`, `restaurant`, `real_estate`, `logistics`, `contract`, `event`, `media`, `banking`, `facility`, `customer_service`, `insurance` (hoặc mã Topic active xem tại `/admin/taxonomy`).
- **`level_tag`**: `350+`, `500+`, `650+`, `800+`, `900+` (xem tại `/admin/taxonomy`).
- **`word_type`**: `n`, `v`, `adj`, `adv`, `phrase`.
- **`exam_part`**: `part1`, `part2`, `part3`, `part4`, `part5`, `part6`, `part7`.
- **`difficulty`**: `easy`, `medium`, `hard`.
- **`skill`**: `vocabulary`, `grammar`, `reading`, `strategy`.

---

## ═══════════════════════════════════════
## SYSTEM PROMPT: THIẾT LẬP VAI TRÒ CHUYÊN GIA
## ═══════════════════════════════════════

Dùng Prompt này đầu tiên để thiết lập quy tắc làm việc cho AI:

```
Bạn là chuyên gia biên soạn nội dung luyện thi TOEIC với 10 năm kinh nghiệm.
Nhiệm vụ: tạo dữ liệu nội dung cho webapp "DailyE" theo ĐÚNG định dạng import cung cấp trong từng yêu cầu.

QUY TẮC CHUNG:
1. TỰ SÁNG TÁC 100% theo định dạng và độ khó chuẩn TOEIC. TUYỆT ĐỐI không sao chép câu hỏi/đoạn văn từ đề thi thật của ETS hay bất kỳ sách luyện thi nào.
2. Danh mục hợp lệ:
   - topic: office, hr, meeting, finance, marketing, travel, shopping, production, technology, health, restaurant, real_estate, logistics, contract, event, media, banking, facility, customer_service, insurance
   - level_tag: 350+, 500+, 650+, 800+, 900+
   - word_type: n, v, adj, adv, phrase
   - exam_part: part5, part6, part7
   - difficulty: easy, medium, hard
3. Output dạng BẢNG MARKDOWN hoặc CSV đúng thứ tự cột theo template, không thêm cột lạ.
4. Mỗi lần chỉ sinh tối đa 20 dòng để đảm bảo chất lượng. Khi yêu cầu "tiếp tục" cho lô sau, KHÔNG được lặp lại nội dung đã sinh.
5. Sinh xong mỗi lô: tự kiểm tra theo CHECKLIST, báo cáo kết quả kiểm tra, rồi DỪNG LẠI đợi chỉ thị.
```

---

## ═══════════════════════════════════════
## PROMPT 1: SINH DỮ LIỆU TAXONOMY (Excel 2 Sheets)
## ═══════════════════════════════════════

```
Sinh danh mục chủ đề từ vựng TOEIC cho webapp DailyE, output 2 bảng CSV:

BẢNG 1 - topics (cột: code,display_name,description,order_index):
- Sinh 8 topic MỚI xuất hiện thực tế trong bài thi TOEIC.
- code: slug a-z và _, ngắn gọn; display_name: "emoji + tên tiếng Việt";
  description: 1 câu mô tả phạm vi từ vựng; order_index: 13 trở đi.

BẢNG 2 - levels (cột: code,display_name,order_index):
- 1 dòng: 900+ với display_name phong cách "🏆 800 → 900+", order_index = 5.

CHECKLIST tự kiểm tra: code không trùng danh sách đã có, đúng định dạng slug, CSV escape đúng. Báo cáo checklist xong DỪNG LẠI.
```

---

## ═══════════════════════════════════════
## PROMPT 2: SINH DỮ LIỆU TỪ VỰNG ACTIVE RECALL (CSV 8 CỘT)
## ═══════════════════════════════════════

```
SINH DỮ LIỆU TỪ VỰNG - TOPIC [tên_topic] - LEVEL [mức_level]

Sinh 20 từ vựng TOEIC thuộc topic và level trên, output CSV với đúng các cột theo thứ tự:
word,word_type,meaning_vi,example,example_blank,topic,level_tag,audio_url

Yêu cầu chất lượng:
1. word: từ/cụm từ thông dụng đúng ngữ cảnh topic, đúng độ khó level (350+ = cơ bản; 800+ = học thuật/formal).
2. meaning_vi: nghĩa tiếng Việt ngắn gọn, đúng ngữ cảnh TOEIC.
3. example: câu ví dụ 8-15 từ, văn phong business email/thông báo công sở, PHẢI chứa đúng từ gốc hoặc biến thể chia thì đơn giản.
4. example_blank: chính câu example nhưng thay từ đó bằng "___".
5. audio_url: để trống.
6. Không trùng bộ (word, word_type) trong lô này và các lô trước.

CHECKLIST tự kiểm tra:
- [ ] Đủ 20 dòng, đúng thứ tự cột, CSV escape đúng (câu chứa dấu phẩy phải bọc trong dấu nháy kép "")
- [ ] word_type chỉ thuộc n/v/adj/adv/phrase
- [ ] Mọi example chứa từ gốc/biến thể; example_blank khớp example
- [ ] Không có từ nào lặp với lô trước
Báo cáo checklist xong DỪNG LẠI.
```

---

## ═══════════════════════════════════════
## PROMPT 3: SINH CÂU HỎI TOEIC PART 5 (CSV 18 CỘT)
## ═══════════════════════════════════════

```
SINH CÂU HỎI TOEIC PART 5 - KNOWLEDGE TAG [tên_tag] - LEVEL [mức_level]

Sinh 15 câu Part 5 (hoàn thành câu), output CSV đúng thứ tự cột template:
question_code,exam_part,question_type,level_tag,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,knowledge_tag,topic,difficulty,audio_url,transcript,source_id,status

Yêu cầu chất lượng:
1. question_code: P5-W500-001 tăng dần.
2. question_text: câu 10-20 từ ngữ cảnh business, chỗ khuyết là "-------".
3. 4 lựa chọn: 1 đáp án đúng + 3 distractor HỢP LÝ (cùng họ từ với đáp án khi tag là word forms; distractor phải là lỗi người học hay mắc thật).
4. correct_answer: phân bổ ĐỀU A/B/C/D trong lô (mỗi chữ cái 3-4 lần).
5. explanation: tiếng Việt 2-4 câu: vì sao đáp án đúng + vì sao các distractor bị loại.
6. knowledge_tag: đúng tag yêu cầu; topic: chọn phù hợp ngữ cảnh câu; status: draft; audio_url, transcript, source_id: để trống.

CHECKLIST tự kiểm tra:
- [ ] Đáp án đúng thực sự đúng ngữ pháp (tự giải lại từng câu)
- [ ] Không có câu nào 2 đáp án đều chấp nhận được
- [ ] Phân bổ A/B/C/D: mỗi chữ cái 3-4 lần trong 15 câu
- [ ] Không trùng/na ná câu đã sinh ở lô trước
Báo cáo checklist xong DỪNG LẠI.
```

---

## ═══════════════════════════════════════
## PROMPT 4: SINH BÀI HỌC MARKDOWN (.md với Frontmatter)
## ═══════════════════════════════════════

```
SINH BÀI HỌC MARKDOWN - CHỦ ĐỀ [Tên bài học] - LEVEL [mức_level]

Viết 1 file .md hoàn chỉnh theo cấu trúc import của DailyE:

---
title: "Tên bài học thu hút"
slug: "ten-bai-hoc-slug"
skill: "grammar" # vocabulary | grammar | reading | strategy
level_tag: "350+"
topic: "" # mã topic hoặc để rỗng cho nhóm Chung
order_index: 1
---

Thân bài (markdown, 600-900 từ, giọng thân thiện, dễ hiểu cho người mất gốc):
1. Mở đầu: vì sao dạng bài này chiếm nhiều điểm ở Part 5 (2-3 câu).
2. Kiến thức lõi: bảng/dấu hiệu nhận biết qua HẬU TỐ (-tion/-ment/-ness...), kèm ví dụ.
3. Chiến thuật 3 bước giải nhanh.
4. 3 ví dụ minh họa giải từng bước (format giống Part 5).
5. Lỗi hay mắc: 3 bẫy kinh điển.
6. Tóm tắt 5 gạch đầu dòng + câu dẫn "Luyện tập ngay để ghi nhớ 💪".

Không chèn HTML, không chèn ảnh. Xong DỪNG LẠI.
```

---

## ═══════════════════════════════════════
## PROMPT 5: QA SOÁT LỖI DỮ LIỆU IMPORT (6 Tiêu Chí)
## ═══════════════════════════════════════

```
QA DỮ LIỆU IMPORT

Tôi dán bên dưới 1 lô dữ liệu [từ vựng / câu hỏi Part X / taxonomy].
Hãy kiểm tra như một người soát chất lượng khó tính, trả lời từng mục PASS/FAIL kèm số dòng lỗi:

1. Đúng schema: đủ cột, đúng thứ tự, giá trị thuộc danh mục hợp lệ (topic/level/word_type/exam_part).
2. Với câu hỏi: giải lại từng câu độc lập - đáp án ghi trong file có đúng không? Có câu nào 2 đáp án chấp nhận được không?
3. Với từ vựng: nghĩa tiếng Việt có đúng ngữ cảnh TOEIC không? example_blank có khớp example không?
4. Phân bổ correct_answer có cân bằng không?
5. Nghi vấn đạo văn: có câu/đoạn nào giống văn phong đề thi thật nổi tiếng đến mức đáng ngờ không?
6. Trùng lặp nội bộ trong lô?

Liệt kê các dòng cần sửa kèm đề xuất sửa cụ thể. KHÔNG tự sửa cả lô, đợi tôi duyệt.

[DÁN DỮ LIỆU VÀO ĐÂY]
```

---

## ⚡ Quy trình Sử dụng Thực tế

1. **Bước 1**: Copy **SYSTEM PROMPT** paste vào AI (ChatGPT/Gemini/Claude) để khởi tạo quy tắc.
2. **Bước 2**: Copy một trong các **PROMPT 1, 2, 3, 4** tương ứng với loại nội dung cần tạo.
3. **Bước 3**: Nhận dữ liệu AI sinh ra $\rightarrow$ Copy dán vào **PROMPT 5 (QA Soát lỗi)** để kiểm định chất lượng trước khi nạp vào hệ thống.
4. **Bước 4**: Lưu kết quả thành file `.xlsx`, `.csv` hoặc `.md` $\rightarrow$ Vào trang `/admin/import` để tải lên và kiểm tra preview trên giao diện webapp DailyE.
