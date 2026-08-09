# 📘 DailyE - Webapp Học & Luyện thi TOEIC Miễn phí

> **Slogan**: *"Học đúng lỗi sai, tiến bộ mỗi ngày"*

DailyE là nền tảng webapp học kiến thức và luyện thi TOEIC tối ưu cho học viên Việt Nam với triết lý tập trung khắc phục điểm yếu thông qua **Sổ lỗi sai thông minh**, **Hệ thống Học từ vựng Active Recall (Chủ động gợi nhớ)** và **Thuật toán Lặp lại ngắt quãng (SRS Leitner)**.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Lucide Icons
- **State & Form**: React Query (`@tanstack/react-query`) + React Hook Form + Zod validation
- **Backend & Database**: Supabase (PostgreSQL, Authentication, Row Level Security RLS)
- **Import Excel / CSV**: SheetJS (`xlsx`) + Zod validate trực tiếp trên Server Action
- **Deploy**: Vercel

---

## ✨ Danh sách Tính năng & Trạng thái (Feature Matrix)

### 🟢 ĐÃ HOÀN THÀNH (Production Ready)

1. **Xác thực & Phân quyền (Auth & RBAC)**:
   - Đăng ký, Đăng nhập, Google OAuth, Magic Link.
   - Phân quyền người dùng (Học viên Free/Premium vs Admin) bằng RLS Policies và Security Definer functions.
2. **Luyện đề TOEIC (TOEIC Quiz Engine)**:
   - Thi thử nhanh Mini Test 20 phút (hỗn hợp 20 câu có đồng hồ đếm ngược).
   - Luyện tập theo Part (Part 5: Hoàn thành câu, Part 6: Điền đoạn văn, Part 7: Đọc hiểu).
   - Luyện theo Chủ điểm Ngữ pháp / Từ vựng (Knowledge Tags).
   - **Bảo mật đáp án**: Client sử dụng `published_questions_safe` (VIEW loại bỏ `correct_answer` và `explanation`). Server Action chịu trách nhiệm chấm điểm an toàn.
3. **Sổ lỗi sai thông minh (Smart Error Log)**:
   - Tự động ghi nhận các câu trả lời sai vào `error_logs`.
   - Quy tắc khắc phục: Trả lời đúng 2 lần liên tiếp ở 2 phiên khác nhau -> Đổi trạng thái `resolved = true`.
4. **Hệ thống Học Từ vựng Active Recall (Vocab Quiz Engine)** *(Mới ở Phase 5B)*:
   - **Luồng học bài mới theo phiên 10 từ** (`/learn/vocabulary`): Giới thiệu 5 từ (từ, loại từ, nghĩa, ví dụ) -> Quiz 5 từ ngay -> Giới thiệu 5 từ tiếp -> Quiz 5 từ tiếp -> Tổng kết.
   - **3 Dạng bài tập tương tác**:
     1. Trắc nghiệm Anh → Việt (`mcq_en_vi`)
     2. Trắc nghiệm Việt → Anh (`mcq_vi_en`)
     3. Ghép cặp Từ ↔ Nghĩa (`matching`)
   - **Cơ chế Hàng đợi (Queue Repetition)**: Trả lời sai -> từ tự động quay lại **CUỐI hàng đợi phiên**, phải trả lời đúng mới thoát khỏi phiên.
   - **Sinh đề động (On-The-Fly)**: Câu hỏi được tạo ngẫu nhiên từ kho `vocabulary_items` với 3 cấp ưu tiên từ nhiễu (cùng topic+level -> cùng level khác topic -> random toàn kho).
   - **Bảo mật đáp án Server-side**: Không gửi cờ đáp án đúng xuống Client; Server Action đối chiếu trực tiếp từ DB theo `vocabId`.
   - **4 Mức độ thuộc từ (`familiarity` 0-3)**: Mới (0) -> Đã gặp (1) -> Nhớ mờ (2) -> Thuộc (3).
5. **Thuật toán Ôn tập Ngắt quãng (SRS Leitner)**:
   - Khoảng lặp 5 bậc: 1 → 2 → 4 → 7 → 15 ngày (Đúng lên bậc, Sai về bậc 1).
   - Tự động tính toán số từ/câu đến hạn ôn hằng ngày tại Khối 1 trang `/today`.
6. **Bảng điều khiển Hằng ngày (`/today`) & Báo cáo Tiến độ (`/progress`)**:
   - Chuỗi ngày học liên tiếp (Streak 🔥) gộp cả bài luyện đề TOEIC và bài học từ vựng (`vocab_sessions`).
   - Gộp đủ 2 nguồn dữ liệu lỗi sai (TOEIC `error_logs` + Từ vựng `user_vocab_progress`).
   - Biểu đồ 14 ngày gần nhất phân biệt rõ số câu đúng TOEIC vs Từ vựng.
   - Trích xuất Top 3 chủ điểm TOEIC yếu nhất (< 60% accuracy) và Top 5 từ vựng hay sai nhất kèm nút *"Ôn ngay"*.
7. **Quản trị Admin (CMS, Import & Audit Logs)**:
   - Bảng điều khiển Admin Dashboard (`/admin/dashboard`): Thống kê tổng quan & hiển thị 5 thao tác Admin mới nhất.
   - Công cụ kiểm thử Vocab Engine dành riêng cho Admin (`/admin/vocab-test`).
   - Quản lý nội dung (`/admin/content`): Bảng câu hỏi TOEIC, Bài học Markdown, và Bảng từ vựng Active Recall.
   - **Thao tác hàng loạt (Bulk Actions)** *(Phase 5C)*: Select multi/header all, đổi trạng thái Published ↔ Draft hàng loạt, sửa trường metadata theo Whitelist có Zod preview, xóa hàng loạt 2 lớp xác nhận với cơ chế Policy A bảo vệ bản ghi đã có dữ liệu học viên.
   - **Lịch sử thao tác Admin (`/admin/logs`)** *(Phase 5C)*: Xem toàn bộ nhật ký ghi vết thao tác thêm, sửa, xóa (bulk & single) của Admin kèm phân trang, lọc theo action/content type và xem payload JSON detail.
   - **Import Excel / CSV hàng loạt (`/admin/import`)**:
     - Tab 1: Import Câu hỏi TOEIC.
     - Tab 2: Import Từ vựng TOEIC (Zod validation preview dòng Xanh/Vàng/Đỏ, kiểm tra mã topic closed danh mục, chống trùng lặp `(word, word_type, topic)`).

### 🟡 SẮP CÓ (Backlog / Future Phases)

- Dạng luyện gõ chính tả (Typing) và điền từ vựng vào câu (`example_blank`).
- Phát âm Audio từ vựng (tích hợp `audio_url`).
- Các phần thi Nghe TOEIC (Part 1, Part 2, Part 3, Part 4) kèm Trình phát Audio và Hình ảnh câu hỏi Part 1.

---

## 🏗️ Kiến trúc Cơ sở Dữ liệu (Database Schema)

Hệ thống gồm 15 bảng chính trong schema `public`:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    profiles     │───────│  test_attempts  │───────│  user_answers   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │                         │
         │                         ▼                         ▼
         │                ┌─────────────────┐       ┌─────────────────┐
         ├───────────────>│   error_logs    │       │    questions    │
         │                └─────────────────┘       └─────────────────┘
         │                         │
         │                         ▼
         │                ┌─────────────────┐
         ├───────────────>│ review_schedule │
         │                └─────────────────┘
         │                         ▲
         │                         │
         │                ┌─────────────────┐       ┌─────────────────┐
         ├───────────────>│user_vocab_progr.│───────│vocabulary_items │
         │                └─────────────────┘       └─────────────────┘
         │                                                   │
         │                ┌─────────────────┐                ▼
         ├───────────────>│ vocab_sessions  │       ┌─────────────────┐
         │                └─────────────────┘       │  vocab_topics   │
         │                                          └─────────────────┘
         ▼
┌─────────────────┐       ┌─────────────────┐
│ lesson_progress │───────│     lessons     │
└─────────────────┘       └─────────────────┘
```

### Chi tiết các Bảng Từ vựng mới (Phase 5B):
- **`vocab_topics`**: Danh mục 12 chủ đề từ vựng TOEIC (`office`, `hr`, `meeting`, `finance`, `marketing`, `travel`, `shopping`, `production`, `technology`, `health`, `restaurant`, `real_estate`).
- **`vocabulary_items`**: Kho từ vựng với khóa chính `id BIGINT GENERATED ALWAYS AS IDENTITY`, `word`, `word_type` (`n`/`v`/`adj`/`adv`/`phrase`), `meaning_vi`, `example`, `example_blank`, `topic` (FK `vocab_topics.code`), `level_tag`, `status` (`draft`/`published`), ràng buộc `UNIQUE(word, word_type, topic)`.
- **`user_vocab_progress`**: Tiến độ thuộc từ cá nhân (`user_id`, `vocab_id`, `familiarity` 0-3, `correct_streak`, `total_correct`, `total_wrong`, `last_seen_at`, `UNIQUE(user_id, vocab_id)`).
- **`vocab_sessions`**: Nhật ký các phiên học từ vựng (`user_id`, `mode`, `total_items`, `correct_items`, `duration_seconds`, `created_at`).

### 💡 Ghi nhận 2 Nguồn Lỗi sai trong Hệ thống:
1. **Lỗi sai làm bài TOEIC (Part 5, 6, 7, Mini Test)** -> Ghi vào bảng `error_logs`.
2. **Lỗi sai từ vựng (Trắc nghiệm/Matching)** -> Ghi vào bảng `user_vocab_progress` (`total_wrong`, `correct_streak = 0`).
3. **Nơi gộp dữ liệu**:
   - Trang `/today`: Khối 1 đếm từ đến hạn từ `review_schedule`, Khối 4 đếm lỗi TOEIC từ `error_logs`.
   - Trang `/progress`: Báo cáo gộp cả 2 nguồn, trích xuất Top 3 tag TOEIC yếu nhất và Top 5 từ vựng hay sai nhất.

---

## 📁 Cấu trúc Thư mục Dự án (Directory Structure)

```
DailyE/
├── app/
│   ├── (admin)/                    # Phân vùng quản trị Admin (yêu cầu access_level = admin)
│   │   └── admin/
│   │       ├── content/page.tsx     # CMS Quản lý Câu hỏi, Bài học & Từ vựng Active Recall
│   │       ├── dashboard/page.tsx   # Dashboard Thống kê tổng quan
│   │       ├── import/page.tsx      # Tab Import Excel Câu hỏi & Import CSV Từ vựng
│   │       └── vocab-test/page.tsx  # Công cụ thử nghiệm VocabQuizEngine dành cho Admin
│   ├── (learner)/                  # Phân vùng Học viên
│   │   ├── learn/
│   │   │   ├── page.tsx             # Danh sách bài học Markdown & Banner Học từ vựng
│   │   │   ├── vocabulary/page.tsx  # Trang Học từ vựng Active Recall theo Chủ đề
│   │   │   └── [slug]/page.tsx      # Xem chi tiết bài học Markdown
│   │   ├── practice/
│   │   │   ├── page.tsx             # Trang chọn chế độ Luyện đề TOEIC & Luyện từ vựng
│   │   │   ├── session/page.tsx     # Giao diện thi thử / luyện tập Quiz Engine
│   │   │   ├── errors/page.tsx      # Trang Sổ lỗi sai cá nhân
│   │   │   └── result/              # Trang kết quả & Lời giải chi tiết
│   │   ├── today/page.tsx           # Trang chủ hằng ngày (Khối SRS, Lộ trình, Luyện đề)
│   │   └── progress/page.tsx        # Báo cáo tiến độ 14 ngày gộp 2 nguồn & Top từ hay sai
│   ├── actions/                    # Server Actions (Zod validate, Supabase Server Client)
│   │   ├── admin.ts                 # CMS & Import logic
│   │   ├── learn.ts                 # Lấy danh sách bài học Markdown
│   │   ├── vocab.ts                 # Vocab Quiz Engine (generate, submit, finish)
│   │   ├── vocab_learn.ts           # Luồng học từ mới theo phiên 10 từ
│   │   ├── srs.ts                   # Leitner algorithm & Today dashboard data
│   │   └── progress.ts              # Aggregate user performance stats
│   ├── layout.tsx                   # Layout gốc & SEO Metadata
│   └── page.tsx                     # Landing Page giới thiệu
├── components/
│   ├── vocab/                       # Nhóm Component Từ vựng Active Recall
│   │   ├── MCQVocabCard.tsx         # Component Trắc nghiệm 2 chiều (Anh-Việt & Việt-Anh)
│   │   ├── MatchingVocabBoard.tsx   # Component Ghép cặp Từ ↔ Nghĩa (2 cột)
│   │   ├── TopicCard.tsx            # Component Thẻ chủ đề từ vựng kèm tiến độ
│   │   ├── WordIntroCard.tsx        # Component Giới thiệu 5 từ mới trước khi Quiz
│   │   ├── VocabSummaryCard.tsx     # Component Màn tổng kết phiên học từ vựng
│   │   └── VocabQuizEngine.tsx      # Main Container Engine quản lý state & hàng đợi
│   └── ui/                          # Component giao diện shadcn/ui
├── public/
│   └── templates/
│       ├── dailye_questions_template.xlsx  # File mẫu Excel Import Câu hỏi TOEIC
│       └── dailye_vocab_template.csv      # File mẫu CSV Import Từ vựng TOEIC
├── supabase/
│   ├── migrations/                  # Các file SQL Migration chạy trên Supabase
│   │   ├── 001_init.sql             # 12 bảng cơ bản, triggers & safe view
│   │   ├── 002_lesson_progress.sql  # Tiến độ bài học
│   │   ├── 003_srs_and_streak.sql   # SRS & Streak
│   │   ├── 004_vocab_system.sql     # Hệ thống Từ vựng Active Recall (vocab_topics, RLS)
│   │   └── 005_admin_action_logs.sql # Nhật ký thao tác Admin & RLS Security Policies
│   └── scripts/                     # Các SQL Script tiện ích
│       ├── reset_test_data.sql      # Script dọn sạch dữ liệu test (giữ admin/profiles)
│       └── seed_vocab_test.sql       # Script chèn 25 từ vựng test cho 3 chủ đề
└── types/
    └── database.ts                  # Type definitions khớp 100% PostgreSQL schema
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy trên máy local (Local Setup)

### 1. Yêu cầu môi trường
- Node.js version >= 18.0.0
- NPM / Yarn / PNPM

### 2. Tải mã nguồn & Cài đặt thư viện
```bash
git clone https://github.com/your-username/dailye.git
cd dailye
npm install
```

### 3. Cấu hình Biến môi trường (`.env.local`)
Tạo file `.env.local` tại thư mục gốc dựa theo mẫu `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Khởi chạy Server Phát triển (Dev Mode)
```bash
npm run dev
```
Truy cập địa chỉ: `http://localhost:3000`

---

## 🗄️ Hướng dẫn Chạy SQL Migrations & Seed Data trên Supabase

Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard) -> Chọn dự án của bạn -> Mở **SQL Editor** và thực hiện theo các bước:

### Bước 1: Chạy 4 File Migrations theo đúng thứ tự
1. **`supabase/migrations/001_init.sql`**: Khởi tạo cấu trúc bảng chính, Trigger tự tạo Profile, RLS Policies và SAFE VIEW `published_questions_safe`.
2. **`supabase/migrations/002_lesson_progress.sql`**: Khởi tạo bảng `lesson_progress` theo dõi tiến độ bài học.
3. **`supabase/migrations/003_srs_and_streak.sql`**: Bổ sung theo dõi 2 lần đúng liên tiếp trong `error_logs`, chuỗi ngày học liên tiếp (`streak_count`) trong `profiles` và các chỉ mục Index.
4. **`supabase/migrations/004_vocab_system.sql`**: Khởi tạo `vocab_topics` (seed 12 chủ đề), nâng cấp `vocabulary_items`, tạo `user_vocab_progress`, `vocab_sessions`, cập nhật constraint `review_schedule` và RLS policies.

### Bước 2: (Tùy chọn) Chạy Script Reset Dữ liệu Test & Seed Từ Vựng Mẫu
- **`supabase/scripts/reset_test_data.sql`**: Dọn dẹp sạch dữ liệu mẫu thử nghiệm (*Lưu ý: CHỈ dùng khi muốn reset môi trường test, script sẽ giữ nguyên các tài khoản Admin/User trong `profiles`*).
- **`supabase/scripts/seed_vocab_test.sql`**: Chèn 25 từ vựng test ở trạng thái `published` cho 3 chủ đề:
  - `office`: 12 từ (Đủ cho Matching & MCQ cùng topic)
  - `travel`: 10 từ (Đủ cho bài học từ mới)
  - `finance`: 3 từ (*Cố tình ít để test thuật toán fallback phương án nhiễu "cùng level khác topic"*)

---

## 👑 Hướng dẫn Nâng cấp Tài khoản Admin Đầu Tiên

1. Đăng ký tài khoản mới trên trang web: `http://localhost:3000/register` (Ví dụ email: `admin@gmail.com`).
2. Vào **Supabase SQL Editor** chạy câu lệnh nâng cấp quyền:

```sql
UPDATE public.profiles 
SET access_level = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@gmail.com');
```

Sau khi chạy xong lệnh trên, tài khoản của bạn sẽ có đầy đủ quyền truy cập các trang quản trị:
- `/admin/dashboard`: Thống kê hệ thống
- `/admin/vocab-test`: Công cụ kiểm thử Vocab Engine live
- `/admin/content`: Quản lý câu hỏi, bài học Markdown & Từ vựng Active Recall
- `/admin/import`: Nhập liệu hàng loạt bằng file Excel/CSV (Tab Câu hỏi & Tab Từ vựng)

---

## 📥 Hướng dẫn Import Từ vựng Hàng loạt bằng File CSV / Excel

1. Đăng nhập tài khoản Admin -> Truy cập `http://localhost:3000/admin/import`.
2. Chuyển sang **Tab "2. Import Từ vựng TOEIC"**.
3. Nhấp nút **"Tải mẫu CSV Từ vựng"** để lấy file mẫu chuẩn (`public/templates/dailye_vocab_template.csv`).
4. **Quy tắc Validate tự động trên Server Action**:
   - `word`: Bắt buộc.
   - `word_type`: Bắt buộc thuộc `n`, `v`, `adj`, `adv`, `phrase`.
   - `meaning_vi`: Bắt buộc.
   - `example`: Bắt buộc. Nếu câu ví dụ chưa chứa từ gốc -> Hiển thị **Cảnh báo vàng** (vẫn cho phép import).
   - `topic`: Bắt buộc thuộc danh mục đóng 12 topic của `vocab_topics`. Nếu mã topic không tồn tại -> Hiển thị **Lỗi đỏ** kèm gợi ý mã gần đúng nhất.
   - Trùng lặp `(word, word_type, topic)` trong file -> Hiển thị **Lỗi đỏ**.
   - Trùng lặp với Database -> Hiển thị **Cảnh báo vàng** (cho phép ghi đè/bỏ qua qua `upsert`).
5. Bấm **"Nhập các dòng hợp lệ vào DB"**: Dữ liệu được lưu với `status = 'draft'`. Admin vào `/admin/content` -> Tab 3 đổi trạng thái thành `published` để từ vựng xuất hiện trong app.

---

## 🌐 Hướng dẫn Deploy lên Vercel & Cấu hình Supabase

### Bước 1: Deploy lên Vercel
1. Đẩy mã nguồn lên kho chứa GitHub.
2. Đăng nhập [Vercel Dashboard](https://vercel.com) -> Chọn **Add New Project** -> Chọn Repository GitHub của bạn.
3. Tại phần **Environment Variables**, điền 2 biến môi trường:
   - `NEXT_PUBLIC_SUPABASE_URL`: `<URL Supabase của bạn>`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<Anon Key Supabase của bạn>`
4. Nhấn **Deploy** và đợi Vercel tạo domain production (ví dụ: `https://dailye.vercel.app`).

### Bước 2: Thêm Redirect URL trên Supabase Auth
1. Đăng nhập Supabase Dashboard -> Chọn mục **Authentication** -> **URL Configuration**.
2. Tại mục **Site URL**, điền domain Vercel của bạn: `https://dailye.vercel.app`.
3. Tại mục **Redirect URLs**, nhấn **Add URL** và thêm 2 địa chỉ:
   - `https://dailye.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Nhấn **Save** để hoàn tất cấu hình Google OAuth & Magic Link.

---

## 📋 Checklist 12 Mục "Smoke Test" Sau Khi Deploy Production

Sau khi hoàn tất Deploy, tiến hành kiểm thử nhanh 12 mục quan trọng nhất:

| # | Mục Kiểm Thử (Smoke Test) | Trạng Thái Kỳ Vọng |
|---|---|---|
| 1 | **Trang Landing Page (`/`)** | Hiển thị thương hiệu DailyE, khẩu hiệu và các nút Đăng nhập / Đăng ký. |
| 2 | **Đăng ký / Đăng nhập Email (`/register`, `/login`)** | Tạo tài khoản thành công, tự chuyển hướng sang `/onboarding`. |
| 3 | **Onboarding 2 bước (`/onboarding`)** | Chọn được mục tiêu điểm TOEIC và lưu thành công vào `profiles`. |
| 4 | **Quyền Admin (`/admin/dashboard`)** | Tài khoản có `access_level = 'admin'` vào được Dashboard, tài khoản `free` bị chuyển hướng về `/today`. |
| 5 | **Import Excel Câu hỏi & CSV Từ vựng (`/admin/import`)** | Upload file mẫu chuẩn, phân tích Zod 0 lỗi và commit lưu thành công vào DB dưới dạng Draft. |
| 6 | **Quản lý Từ vựng Admin (`/admin/content`)** | Lọc được từ vựng theo Topic/Level/Status, đổi trạng thái Draft ↔ Published mượt mà. |
| 7 | **Học từ vựng Active Recall (`/learn/vocabulary`)** | Chọn topic -> Giới thiệu 5 từ -> Quiz 5 từ -> Màn tổng kết -> Dữ liệu lưu vào DB với `familiarity = 1` và `review_schedule` (due ngày mai). |
| 8 | **Luyện ghép cặp Matching (`/practice`)** | Khởi chạy mode Ghép cặp 2 cột, chọn đúng cặp mờ đi ✅, chọn sai nháy đỏ ❌. |
| 9 | **Luyện đề Quiz Engine (`/practice/session`)** | Đề thi TOEIC Part 5/6/7 hiển thị an toàn không lộ đáp án, đếm giờ chạy chuẩn, nộp bài thành công. |
| 10 | **Trang Kết quả (`/practice/result/[attemptId]`)** | Hiển thị đúng điểm số %, lộ lời giải chi tiết và gợi ý bài học đối với các tag bị sai. |
| 11 | **Ôn từ vựng SRS hằng ngày (`/today`)** | Từ vựng đến hạn do SRS Leitner xuất hiện ở Khối 1 (`🔤 X từ đến hạn ôn`), làm bài quiz thành công và Streak 🔥 tăng ngày. |
| 12 | **Báo cáo Tiến độ 14 ngày (`/progress`)** | Hiển thị thống kê từ đã thuộc/đang học, Top 5 từ hay sai nhất kèm nút *"Ôn ngay"*, biểu đồ 14 ngày phân biệt rõ cột TOEIC vs Vocab. |

---

## 📝 Nhật ký Thay đổi (Changelog)

### Version 2.2.0 (2026-08-09) - Phase 5C: Bulk Actions Admin Content & Audit Logging
- **Thao tác hàng loạt (Bulk Actions)** tại `/admin/content` áp dụng đồng bộ cho cả 3 tab (Câu hỏi, Bài học, Từ vựng):
  - Checkbox chọn từng dòng + Checkbox header chọn toàn bộ bản ghi trên trang hiện tại (tối đa 100).
  - Floating Bulk Action Bar với các tính năng: Đổi trạng thái (`draft` ↔ `published`), Sửa trường metadata theo Whitelist có Zod live preview, Xóa hàng loạt.
  - **Chính sách xóa an toàn (Policy A)**: Rà soát an toàn trước khi xóa, tự động ngăn chặn xóa các bản ghi đã có lịch sử làm bài/học bài của học viên, hướng dẫn chuyển `status = 'draft'` để ẩn. Xác nhận 2 lớp bắt gõ số lượng chữ số để mở khóa nút xóa.
- **Trang Nhật ký thao tác Admin (`/admin/logs`)**:
  - Đọc từ bảng DB `admin_action_logs` (Migration `005_admin_action_logs.sql`).
  - Hiển thị danh sách thao tác kèm badge phân loại màu sắc, thông tin Admin thực hiện, thời gian, số lượng bản ghi ảnh hưởng.
  - Hỗ trợ lọc theo loại hành động, loại nội dung, phân trang 20 dòng/trang.
  - Modal xem chi tiết payload JSONB & danh sách ID ảnh hưởng.
  - Ghi log bổ sung cho cả các thao tác thêm, sửa, xóa đơn lẻ cũ.
- **Nâng cấp Dashboard Admin (`/admin/dashboard`)**:
  - Thêm thẻ *"Thao tác Admin gần đây"* hiển thị 5 log mới nhất và nút dẫn tới `/admin/logs`.

### Version 2.1.0 (2026-08-08) - Phase 5B: Active Recall Vocab Engine & Spaced Repetition System
- **Nâng cấp Hệ thống Học từ vựng**: Thay thế toàn bộ component lật thẻ Flashcard thụ động cũ tại `/learn/vocabulary` bằng **Vocab Quiz Engine tương tác 2 chiều (Active Recall)**.
- **Dạng bài tập mới**: Trắc nghiệm Anh → Việt (`mcq_en_vi`), Trắc nghiệm Việt → Anh (`mcq_vi_en`) và Ghép cặp Từ ↔ Nghĩa (`matching`).
- **Cơ chế Hàng đợi (Queue Repetition)**: Trả lời sai từ vựng -> từ đó tự động đẩy về cuối hàng đợi phiên.
- **Bảng Database mới (Migration `004_vocab_system.sql`)**:
  - `vocab_topics`: Seed 12 chủ đề từ vựng TOEIC với icon emoji và thứ tự chuẩn.
  - `user_vocab_progress`: Theo dõi 4 mức thuộc từ (`familiarity` 0-3), streak đúng, số lần sai.
  - `vocab_sessions`: Lưu nhật ký các phiên học từ vựng.
  - `vocabulary_items`: Nâng cấp khóa chính `BIGINT`, thêm `word_type`, `example_blank`, `status`, FK `topic`, ràng buộc `UNIQUE(word, word_type, topic)`.
- **Tích hợp toàn diện**:
  - Trang `/today`: Khối 1 đổi thành *"🔤 X từ vựng đến hạn ôn tập"*, tính streak 🔥 cho các phiên học từ vựng.
  - Trang `/practice`: Bổ sung khối chọn Luyện tập Từ vựng Active Recall theo chủ đề.
  - Trang `/progress`: Thêm thống kê số từ đã thuộc/đang học, Top 5 từ hay sai nhất và gộp biểu đồ 14 ngày (TOEIC vs Vocab).
  - Trang `/admin/import`: Thêm Tab 2 Import Từ vựng qua file CSV/Excel với Zod validation preview.
  - Trang `/admin/content`: Thêm Tab 3 Quản lý từ vựng Active Recall.
- **Breaking Changes**: Reset dữ liệu test cũ (`reset_test_data.sql`), tái cấu trúc bảng `vocabulary_items` từ UUID sang BIGINT.
