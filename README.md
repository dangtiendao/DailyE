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
   - **Chế độ Bộ Đề Thi Luyện Tập Cố Định (`/practice`)** *(Phase 5E)*: Học viên làm đề thi cố định theo đúng thứ tự `order_index` từ bộ đề do Admin xuất bản, có đồng hồ đếm ngược `time_limit_minutes` và lưu điểm số vào `test_attempts` gắn đúng `test_id`.
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
   - Quản lý nội dung (`/admin/content`): Bảng câu hỏi TOEIC, Bài học Markdown, Từ vựng Active Recall, và **Đề thi TOEIC (Tab 4)** với các tính năng xem số lượt học viên làm bài, đổi status Draft ↔ Published, và chặn xóa an toàn khi đã có dữ liệu làm bài.
   - **Thao tác hàng loạt (Bulk Actions)** *(Phase 5C)*: Select multi/header all, đổi trạng thái Published ↔ Draft hàng loạt, sửa trường metadata theo Whitelist có Zod preview, xóa hàng loạt 2 lớp xác nhận với cơ chế Policy A bảo vệ bản ghi đã có dữ liệu học viên.
   - **Lịch sử thao tác Admin (`/admin/logs`)** *(Phase 5C)*: Xem toàn bộ nhật ký ghi vết thao tác thêm, sửa, xóa (bulk & single) của Admin kèm phân trang, lọc theo action/content type và xem payload JSON detail.
   - **Hệ thống Import Hàng loạt Multi-content (`/admin/import`)** *(Nâng cấp ở Phase 5E)*:
     - Tab 1: Import Câu hỏi TOEIC (.xlsx).
     - Tab 2: Import Từ vựng TOEIC (.csv / .xlsx).
     - Tab 3: Import Bài học Multi-file Markdown (.md với YAML Frontmatter, giới hạn 50 file/lần, tối đa 200KB/file).
     - Tab 4: Import Liên kết Bài học ↔ Câu hỏi (`lesson_questions` từ file Excel/CSV).
     - Tab 5: Import Đề thi TOEIC (Excel 2 Sheets: `tests` và `test_questions`, kiểm tra số câu theo `test_type` và hỗ trợ ghi đè overwrite an toàn qua Stored Procedure PL/pgSQL).
     - Tab 6: Import Taxonomy Động (Excel 2 Sheets: `topics` và `levels`, quy tắc chỉ thêm mới/cập nhật metadata, revalidate cache tức thì).
8. **Quản trị Taxonomy Hệ thống & Level Động (`/admin/taxonomy`)** *(Phase 5D & 5E)*:
   - **Quản lý Chủ đề (Topics)**: Thêm mới, sửa tên hiển thị/mô tả/thứ tự, bật/tắt ẩn hiển thị (`is_active`). Xóa an toàn với đếm dữ liệu liên kết 3 bảng (`vocabulary_items`, `lessons`, `questions`) và công cụ di chuyển nội dung hàng loạt `moveTopicContent` chạy bằng SQL RPC Transaction.
   - **Quản lý Trình độ (Levels)**: Quản lý động danh mục Trình độ (`350+`, `500+`, `650+`, `800+`, `900+`, ...), loại bỏ hoàn toàn các danh sách/enum hardcode trên toàn ứng dụng.
   - **Single Source of Truth**: Đồng bộ động taxonomy cho toàn hệ thống (Import Excel/Markdown, Bulk Actions, Form CMS Admin, Lọc Bài học `/learn`, Danh mục Từ vựng `/learn/vocabulary`, Form Luyện tập `/practice`).
   - **Bảo toàn SRS đối với Topic Ẩn**: Khi Admin ẩn một Topic (`is_active = false`), từ vựng thuộc topic đó mà học viên đã nạp **vẫn xuất hiện và ôn tập bình thường** khi đến hạn SRS ở `/today` và các phiên quiz SRS.
9. **Tối ưu Hiệu năng UI/UX & Resilient Background Sync** *(Mới ở Phase 5F)*:
   - **Phản hồi thị giác < 100ms**: Bấm chọn option Quiz phản hồi 0ms, đối chiếu server ~80ms, Nút "Câu tiếp theo" 0ms delay.
   - **Non-blocking Progress Sync**: Tách việc ghi `user_vocab_progress`, `review_schedule` SRS thành tác vụ chạy ngầm bất đồng bộ.
   - **Auto-Retry & LocalStorage Fallback**: Ghi ngầm fail ➔ Auto-retry 1 lần ➔ Vẫn fail ➔ Lưu tạm `localStorage` (`dailye_pending_vocab_progress`) + Toast cảnh báo. Tự động flush bù khi làm câu tiếp hoặc kết thúc phiên. Zero data loss khi rớt mạng.
   - **Instant Tab Navigation & Prefetching**: Prefetching ngầm khi hover/touch bottom nav & card bài học. `useTransition` chuyển tab admin mượt mà không chớp màn hình.

### 🟡 SẮP CÓ (Backlog / Future Phases)

- Export Taxonomy và Đề thi ra file Excel.
- Import Media (Audio phát âm từ vựng & Hình ảnh câu hỏi TOEIC Part 1).
- Dạng luyện gõ chính tả (Typing) và điền từ vựng vào câu (`example_blank`).
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

### Chi tiết các Bảng Taxonomy, Bài học & Đề thi (Phase 5D & 5E):
- **`topics`**: Danh mục chủ đề động (`code` PK, `display_name`, `description`, `order_index`, `is_active`, `created_at`).
- **`levels`**: Danh mục trình độ động (`code` PK như `'350+'`, `'500+'`, `'650+'`, `'800+'`, `display_name`, `order_index`, `is_active`, `created_at`).
- **`lessons`**: Bài học Markdown với `topic` (FK `topics.code` ON DELETE SET NULL), `level_tag` (FK `levels.code`).
- **`lesson_questions`**: Bảng liên kết Bài học ↔ Câu hỏi (`lesson_id`, `question_id`, `order_index`, PRIMARY KEY `(lesson_id, question_id)`).
- **`tests`**: Bộ đề thi cố định (`id` UUID PK, `title`, `test_type` `'mini'|'part'|'full'`, `time_limit_minutes`, `status` `'draft'|'published'`).
- **`test_questions`**: Cấu trúc đề thi (`test_id`, `question_id`, `order_index`, PRIMARY KEY `(test_id, question_id)`).
- **`test_attempts`**: Lượt thi của học viên (`id` UUID PK, `user_id`, `test_id` FK `tests.id` ON DELETE SET NULL, `score`, `total_questions`, `time_spent_seconds`, `created_at`).

### Cấu trúc File & Quy tắc Validate Import (Phase 5E):

#### **1. Import Bài học Multi-file Markdown (.md với YAML Frontmatter)**:
Cấu trúc Frontmatter chuẩn:
```yaml
---
title: "Bí quyết chinh phục TOEIC Part 5"
slug: "bi-quyet-par-5"
skill: "strategy" # vocabulary | grammar | reading | strategy
level_tag: "500+" # FK levels.code (phải active)
topic: "office"   # FK topics.code (tùy chọn, trống = nhóm "Chung")
order_index: 1    # Số nguyên >= 0 (tùy chọn)
---
# Nội dung bài học (Markdown)
...
```
- **Quy tắc validate**: `title` không rỗng, `slug` chuẩn URL format (chữ thường, số, dấu gạch ngang) và không trùng lặp, `skill` bắt buộc thuộc 4 giá trị chuẩn, `level_tag` và `topic` validate qua `lib/taxonomy.ts` (chỉ nhận item `is_active = true`).

#### **2. Import Đề thi (Excel 2 Sheets: `tests` & `test_questions`)**:
- Sheet 1 `tests`: `test_code`, `title`, `test_type` (`mini`/`part`/`full`), `time_limit_minutes`.
- Sheet 2 `test_questions`: `test_code`, `question_code`, `order_index`.
- **Chính sách Overwrite & SQL Transaction Block**: Khi import trùng `test_code` hoặc `title`, hệ thống tự động cảnh báo Vàng. Lệnh ghi đè gọi Stored Procedure PL/pgSQL `public.import_test_with_questions` (`supabase/migrations/008_import_test_transaction.sql`) chạy nguyên tử trong 1 Transaction Block với cơ chế **ROLLBACK 100%** nếu có bất kỳ lỗi chèn câu hỏi nào.

#### **3. Import Taxonomy (Excel 2 Sheets: `topics` & `levels`)**:
- Sheet 1 `topics`: `code` (`/^[a-z0-9_]+$/`), `display_name`, `description`, `order_index`.
- Sheet 2 `levels`: `code` (`/^[a-zA-Z0-9_+ -]+$/`), `display_name`, `order_index`.
- **Quy tắc An toàn Taxonomy**: **Chỉ thêm mới (`is_active = true`) hoặc cập nhật metadata (`display_name`, `description`, `order_index`)**. TUYỆT ĐỐI không bao giờ xóa, không bao giờ ẩn (`is_active = false`) hay thay đổi khóa chính `code`.
- **Cơ chế Revalidate Cache**: Ngay sau khi commit, Server Action gọi `revalidateTaxonomyCache()` giúp dữ liệu mới cập nhật tức thì trên các dropdown import và trang học viên mà không cần F5 xoá cache.

---

## 🏛️ Kiến trúc & Chiến lược Hiệu năng (Performance Architecture)

### 1. Cấu hình React Query Cache Tập trung & Danh sách Ngoại lệ
- **Provider tập trung**: Khai báo duy nhất tại `components/shared/providers.tsx`.
- **Cấu hình mặc định**:
  - `staleTime`: 60.000 ms (60 giây)
  - `gcTime`: 1.800.000 ms (30 phút)
  - `refetchOnWindowFocus`: `false` (Không refetch khi chuyển cửa sổ)
  - `retry`: `1` (Thử lại 1 lần nếu query thất bại)
- **Danh sách NGOẠI LỆ (Query bắt buộc giữ tươi real-time, KHÔNG áp staleTime dài)**:
  1. **Số lượng từ SRS đến hạn (`dueVocabCount`) tại `/today`**: Luôn query trực tiếp từ server để học viên thấy đúng số từ cần ôn hằng ngày.
  2. **Tiến trình phiên Quiz (`activeQueue`)**: Lưu trực tiếp trong RAM Client State trong suốt phiên làm bài.
  3. **Xác thực đáp án trắc nghiệm (`verifyVocabAnswer`)**: Gọi Server Action trực tiếp không qua cache query để đối chiếu đáp án DB.

### 2. Mô hình Suspense Streaming & Localized Error Boundaries tại `/today`
Trang `/today` sử dụng kiến trúc Streaming Server Components:
- **Khối Header & Streak**: Render trực tiếp không qua Suspense (dữ liệu nhẹ).
- **4 Khối chức năng độc lập**:
  - `DueVocabBlock`: Khối 1 • Từ vựng SRS đến hạn.
  - `NextLessonBlock`: Khối 2 • Lộ trình bài học tiếp theo.
  - `RecommendedPracticeBlock`: Khối 3 • Bài luyện đề xuất.
  - `UnresolvedErrorsBlock`: Khối 4 • Sổ lỗi sai chưa khắc phục.
- Mỗi khối được bọc riêng biệt trong `<Suspense fallback={<BlockSkeleton />}>` và `<BlockErrorBoundary>`. Nếu 1 khối gặp sự cố DB tạm thời, 3 khối còn lại vẫn stream HTML và hiển thị bình thường.

### 3. Sơ đồ Luồng Submit Quiz Non-blocking & LocalStorage Fallback

```
[User Chọn Đáp Án] (0ms - Hiển thị viền chọn + Spinner, disable 4 option)
        │
        ▼
[verifyVocabAnswer()] ──► Trực tiếp đối chiếu DB (1 query ~80ms)
        │
        ▼
[Trả kết quả ✅/❌] ──► Hiển thị Thẻ Feedback & Mở Nút "Câu tiếp theo" (0ms wait)
        │
        ▼ (Tách luồng ghi - Non-blocking Background Sync)
[saveVocabProgress()] ──► Tự động Retry 1 lần nếu gặp sự cố mạng
        │ (Thất bại lần 2)
        ▼
[LocalStorage Backup] ──► Lưu tạm vào `dailye_pending_vocab_progress` + Toast cảnh báo
        │
        ▼ (Khi làm câu tiếp / nạp lại trang / hoàn thành phiên)
[flushPendingProgressQueue()] ──► Đồng bộ bù toàn bộ queue tồn đọng lên Supabase
```

### 4. Quy ước Component Nặng & Dynamic Import
- Các thư viện nặng hoặc Modal quản trị lớn (như Editor Markdown, XLSX import handlers, Modals thao tác hàng loạt) phải sử dụng `dynamic()` để lazy load:
  ```typescript
  const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
    ssr: false,
    loading: () => <SkeletonLayout />,
  });
  ```
- **Thư viện SheetJS (`xlsx`)**: Khai báo và import **duy nhất trong Server Actions (`app/actions/admin.ts`)**, tuyệt đối không import ở Client Component để tránh làm phình First Load JS Bundle.

---

## 👨‍💻 Quy ước Phát triển cho Developer (Dev Guidelines)

1. **Trang mới bắt buộc có `loading.tsx` Skeleton khớp Layout**:
   - Mọi route mới trong `app/` phải tạo file `loading.tsx` sử dụng Tailwind `animate-pulse`.
   - Skeleton phải mô phỏng **chính xác 100% kích thước, số lượng card và vị trí bảng/biểu đồ** của trang thật để ngăn ngừa giật tràn màn hình (Cumulative Layout Shift - CLS).
2. **Khai báo Query tập trung qua `lib/query-options.ts`**:
   - Tất cả các truy vấn React Query mới phải khai báo helper `queryOptions` tập trung tại `lib/query-options.ts`.
   - Giúp đồng bộ chuẩn hóa `queryKey` và `queryFn` trên toàn bộ ứng dụng, phục vụ prefetching ngầm chính xác.
3. **Invalidation Scoping Chuẩn xác**:
   - Khi thực hiện mutation (Thêm/Sửa/Xóa dữ liệu), chỉ invalidate đúng `queryKey` cụ thể:
     ```typescript
     queryClient.invalidateQueries({ queryKey: ['publishedLessons'] });
     ```
   - TUYỆT ĐỐI không gọi `queryClient.invalidateQueries()` không tham số hoặc invalidate prefix quá rộng gây spam request toàn hệ thống.

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
│   │       ├── taxonomy/page.tsx    # Quản lý Taxonomy Hệ thống (Topics & Levels)
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
│   ├── lib/
│   │   ├── taxonomy.ts              # Single Source of Truth Taxonomy Service
│   │   └── admin/
│   │       ├── taxonomy-actions.ts  # Admin Server Actions cho Topics & Levels CRUD
│   │       └── bulk-actions.ts      # Server Actions thao tác hàng loạt
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
│       ├── dailye_questions_template.xlsx        # File mẫu Excel Import Câu hỏi TOEIC
│       ├── dailye_vocab_template.csv            # File mẫu CSV Import Từ vựng TOEIC
│       ├── dailye_lesson_questions_template.xlsx# File mẫu Excel Liên kết Bài học ↔ Câu hỏi
│       ├── dailye_tests_template.xlsx           # File mẫu Excel Import Đề thi (2 Sheets)
│       └── dailye_taxonomy_template.xlsx        # File mẫu Excel Import Taxonomy (2 Sheets)
├── supabase/
│   ├── migrations/                  # Các file SQL Migration chạy trên Supabase
│   │   ├── 001_init.sql             # 12 bảng cơ bản, triggers & safe view
│   │   ├── 002_lesson_progress.sql  # Tiến độ bài học
│   │   ├── 003_srs_and_streak.sql   # SRS & Streak
│   │   ├── 004_vocab_system.sql     # Hệ thống Từ vựng Active Recall (vocab_topics, RLS)
│   │   ├── 005_admin_action_logs.sql # Nhật ký thao tác Admin & RLS Security Policies
│   │   ├── 006_dynamic_taxonomy.sql # Dynamic Taxonomy (nâng cấp topics, bảng levels, FKs)
│   │   ├── 007_move_topic_content_rpc.sql # PL/pgSQL Stored Procedure di chuyển data trong SQL Transaction
│   │   └── 008_import_test_transaction.sql # PL/pgSQL Stored Procedure import/overwrite Đề thi trong SQL Transaction
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

### Bước 1: Chạy 7 File Migrations theo đúng thứ tự
1. **`supabase/migrations/001_init.sql`**: Khởi tạo cấu trúc bảng chính, Trigger tự tạo Profile, RLS Policies và SAFE VIEW `published_questions_safe`.
2. **`supabase/migrations/002_lesson_progress.sql`**: Khởi tạo bảng `lesson_progress` theo dõi tiến độ bài học.
3. **`supabase/migrations/003_srs_and_streak.sql`**: Bổ sung theo dõi 2 lần đúng liên tiếp trong `error_logs`, chuỗi ngày học liên tiếp (`streak_count`) trong `profiles` và các chỉ mục Index.
4. **`supabase/migrations/004_vocab_system.sql`**: Khởi tạo `vocab_topics` (seed 12 chủ đề), nâng cấp `vocabulary_items`, tạo `user_vocab_progress`, `vocab_sessions`, cập nhật constraint `review_schedule` và RLS policies.
5. **`supabase/migrations/005_admin_action_logs.sql`**: Khởi tạo bảng `admin_action_logs` lưu vết nhật ký thao tác Admin.
6. **`supabase/migrations/006_dynamic_taxonomy.sql`**: Nâng cấp `topics` động, tạo bảng `levels` động (seed 4 level), cập nhật ràng buộc FKs và RLS policies.
7. **`supabase/migrations/007_move_topic_content_rpc.sql`**: Tạo PL/pgSQL Stored Procedure `public.move_topic_content` di chuyển dữ liệu trong SQL Transaction block.

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
- `/admin/taxonomy`: Quản lý Taxonomy Hệ thống (Chủ đề & Trình độ)
- `/admin/logs`: Nhật ký thao tác Admin

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
   - `topic`: Bắt buộc thuộc danh mục `topics` và `is_active = true`. Nếu mã topic không tồn tại -> Hiển thị **Lỗi đỏ** kèm gợi ý mã gần đúng. Nếu topic bị ẩn -> Báo lỗi đỏ không cho phép import.
   - `level_tag`: Bắt buộc thuộc danh mục `levels` và `is_active = true`.
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

## 📋 Checklist 19 Mục "Smoke Test" Sau Khi Deploy Production

Sau khi hoàn tất Deploy, tiến hành kiểm thử nhanh 19 mục quan trọng nhất:

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
| 13 | **Import Multi-file Bài học .md (`/admin/import` - Tab 3)** *(Mới ở 5E)* | Upload 3 file `.md` mẫu $\rightarrow$ Preview render đúng, báo xanh 2 file hợp lệ, báo đỏ 1 file lỗi syntax/slug, commit thành công vào DB. |
| 14 | **Import & Làm Đề thi Cố định (`/practice`)** *(Mới ở 5E)* | Import đề thi Excel 2 sheets $\rightarrow$ Publish tại `/admin/content` $\rightarrow$ Học viên thấy mục Bộ Đề thi cố định tại `/practice`, làm bài đúng thứ tự câu hỏi và countdown 20 phút $\rightarrow$ Kết quả ghi nhận vào `test_attempts`. |
| 15 | **Import Liên kết Bài học ↔ Câu hỏi với Code sai (`/admin/import` - Tab 4)** *(Mới ở 5E)* | Upload file liên kết chứa `question_code` hoặc `lesson_slug` không tồn tại $\rightarrow$ Preview hiển thị lỗi Đỏ kèm thông báo gợi ý mã gần đúng. |
| 16 | **Import Taxonomy & Dynamic Cache Revalidate (`/admin/import` - Tab 6)** *(Mới ở 5E)* | Import file mẫu Taxonomy 2 sheets $\rightarrow$ Topic/Level mới xuất hiện NGAY TRONG DROPDOWN của Tab Import Từ vựng mà không cần F5 xoá cache. |
| 17 | **Chuyển tab Không Trắng Màn hình (`/today` ↔ `/learn` ↔ `/progress`)** *(Phase 5F)* | Chuyển tab trên mạng Slow 3G hiển thị Skeleton < 100ms (lần 1) và hiển thị dữ liệu tức thì < 50ms nhờ React Query cache (lần 2). |
| 18 | **Phản hồi Quiz Tức thì < 100ms** *(Phase 5F)* | Click chọn đáp án trắc nghiệm hiển thị hiệu ứng chờ 0ms, đối chiếu kết quả server ~80ms, nút "Câu tiếp theo" active ngay lập tức 0ms delay. |
| 19 | **Bảo vệ Dữ liệu SRS khi Rớt Mạng** *(Phase 5F)* | Ngắt kết nối mạng giữa phiên quiz $\rightarrow$ Toast màu vàng thông báo + dữ liệu lưu tạm `localStorage` $\rightarrow$ Kết nối lại tự động flush đủ dòng vào `user_vocab_progress` & `review_schedule`. |

---

## 📝 Nhật ký Thay đổi (Changelog)

### Version 2.5.0 (2026-08-12) - Phase 5F: UI/UX Performance Optimization & Resilient Sync
- **Tối ưu hóa Phản hồi Thị giác & Tốc độ UI (~100ms Goal)**:
  - Tách luồng `verifyVocabAnswer()` (chỉ đối chiếu đáp án trong 1 query ~80ms) và luồng `saveVocabProgress()` (ghi ngầm tiến độ SRS bất đồng bộ).
  - Nút "Câu tiếp theo" được giải phóng 100% (0ms delay), không bị đơ/hoãn do I/O cơ sở dữ liệu.
  - Timeout Safety Guard (5 giây): Tự động khôi phục trạng thái 4 option nếu kết nối mạng gián đoạn.
- **Cơ chế Ghi ngầm An toàn & Resilient LocalStorage Sync**:
  - Tự động Retry 1 lần khi tác vụ ghi ngầm SRS thất bại.
  - Nếu vẫn thất bại: Tự động sao lưu bản ghi vào `localStorage` (`dailye_pending_vocab_progress`) và phát Toast cảnh báo. Tự động flush bù khi làm câu tiếp theo, mở lại trang hoặc hoàn thành phiên học. Zero data loss.
- **Cấu hình React Query Cache & Prefetching Navigation**:
  - Khai báo Cấu hình mặc định tại `components/shared/providers.tsx` (`staleTime: 60s`, `gcTime: 30m`, `retry: 1`).
  - Thêm `queryOptions` tập trung tại `lib/query-options.ts`.
  - Tích hợp handler prefetching ngầm `onMouseEnter` / `onTouchStart` tại thanh Bottom Nav và thẻ bài học `LessonCardLink`.
- **Mô hình Suspense Streaming & Skeleton Loading**:
  - Tạo mới 8 file `loading.tsx` chuẩn skeleton layout cho: `/today`, `/learn`, `/learn/vocabulary`, `/practice`, `/progress`, `/admin/content`, `/admin/import`, `/admin/taxonomy`.
  - Trang `/today` tách 4 khối chức năng bọc `<Suspense>` và `<BlockErrorBoundary>` riêng biệt.
- **Chống Re-render & `useTransition` Admin**:
  - Bọc `QuizProgressBar` trong `React.memo` và memoize callbacks với `useCallback`.
  - Áp dụng `useTransition` cho thao tác đổi tab tại `/admin/content`, duy trì giao diện mờ nhẹ `opacity-60` không bị chớp trắng màn hình.
- **Bảo mật đáp án 100%**: Payload `generateVocabQuiz` ẩn hoàn toàn `meaningVi`, `example` và dùng ID option ngẫu nhiên `opt-1-xxxx`.
- **Bảng số liệu So sánh Trước vs Sau Phase 5F**:

| Chỉ số / Metric | Trước Phase 5F | Sau Phase 5F | Mức cải thiện |
| :--- | :---: | :---: | :---: |
| **Thời gian chuyển tab Bottom Nav (Fast 3G)** | 800ms - 1500ms (Màn hình chớp/khựng) | **< 100ms** (Skeleton lần 1 / Instant < 50ms lần 2) | **Nhanh hơn 15x** |
| **Thời gian click đáp án Quiz ➔ Feedback** | 400ms - 800ms (Chờ 6 DB queries) | **~80ms** (Instant UI feedback + 1 DB query) | **Nhanh hơn 8x** |
| **Độ hoãn Nút "Câu tiếp theo"** | 200ms - 500ms (Đợi ghi DB xong mới bấm được) | **0ms** (Ghi ngầm Non-blocking background sync) | **Hoàn toàn hết đơ** |
| **Bảo toàn dữ liệu rớt mạng** | Mất dữ liệu SRS nếu ngắt kết nối | **100%** (Auto-Retry + LocalStorage backup & Auto-flush) | **Zero Data Loss** |
| **First Load JS shared by all** | ~118 kB | **107 kB** | Giảm ~10 kB |

- **Bảng dung lượng Bundle sản xuất (`next build`)**:
  - Shared JS by all: **107 kB**
  - `/today`: **139 kB** | `/learn`: **114 kB** | `/practice`: **116 kB** | `/progress`: **120 kB** | `/admin/content`: **163 kB**
- **Breaking Changes**: KHÔNG (100% tương thích ngược, 0% thay đổi DB schema, 0% thay đổi RLS policies).

### Version 2.4.0 (2026-08-12) - Phase 5E: Multi-content Import Pipeline & Fixed Test Engine
- **Hệ thống Import Hàng loạt Multi-content (`/admin/import`)**:
  - **Tab 3 (Import Bài học .md)**: Hỗ trợ upload tối đa 50 file Markdown với YAML frontmatter cùng lúc. Server Action parse và validate Zod các trường `title`, `slug` UNIQUE, `skill`, `level_tag`, `topic` với taxonomy động.
  - **Tab 4 (Liên kết Bài học ↔ Câu hỏi)**: Import file Excel/CSV thiết lập mối quan hệ giữa bài học và câu hỏi trắc nghiệm, tự động gợi ý giá trị gần đúng nếu trỏ tới code không tồn tại.
  - **Tab 5 (Import Đề thi TOEIC)**: Import file Excel 2 Sheets (`tests` và `test_questions`). Hỗ trợ ghi đè (overwrite) bộ đề thi an toàn trong 1 SQL Transaction Block qua Stored Procedure PL/pgSQL `public.import_test_with_questions` (Migration `008_import_test_transaction.sql`).
  - **Tab 6 (Import Taxonomy)**: Import danh mục Chủ đề và Trình độ từ file Excel 2 Sheets (`topics` và `levels`). Áp dụng quy tắc an toàn "chỉ thêm mới / cập nhật metadata, không bao giờ xóa hay ẩn" và tự động gọi `revalidateTaxonomyCache()` ngay sau khi commit.
- **Chế độ Bộ Đề Thi Luyện Tập Cố Định (`/practice`)**:
  - Trang học viên bổ sung phần *"📄 Bộ Đề Thi Luyện Tập Cố Định"* liệt kê các bộ đề thi đã xuất bản (`status = 'published'`).
  - Quiz Engine hỗ trợ tham số `testId`, nạp đúng danh sách câu hỏi cố định theo `order_index ASC`, đếm ngược thời gian `time_limit_minutes` và lưu lịch sử làm bài vào `test_attempts`.
- **Quản lý Đề thi cho Admin (`/admin/content` - Tab 4)**:
  - Bổ sung Tab Quản lý Đề thi TOEIC hiển thị loại đề, thời gian, số lượng câu hỏi, số lượt làm bài của học viên, bật/tắt trạng thái Published ↔ Draft và chặn xóa an toàn khi đề thi đã có dữ liệu `test_attempts > 0`.
- **Bảo mật & Audit Logging**:
  - Tất cả 4 luồng import mới đều yêu cầu kiểm tra quyền Admin Server-side (`checkAdminAuth()`) và ghi vết đầy đủ vào 2 bảng `content_imports` và `admin_action_logs`.
  - Hiển thị Markdown preview an toàn thoát JSX, không sử dụng `dangerouslySetInnerHTML`.
- **Breaking Changes**: KHÔNG (Tương thích ngược 100% với dữ liệu và pipeline cũ).

### Version 2.3.0 (2026-08-09) - Phase 5D: Dynamic System Taxonomy & Level Engine
- **Trang Quản trị Taxonomy (`/admin/taxonomy`)**:
  - Tab 1: Quản lý Chủ đề (Topics) - Thêm mới, sửa tên hiển thị/mô tả/thứ tự, bật/tắt ẩn (`is_active`), đếm chính xác số lượng bản ghi liên kết ở 3 bảng (`vocabulary_items`, `lessons`, `questions`).
  - Nút **"Chuyển nội dung"**: Di chuyển toàn bộ từ vựng, bài học, câu hỏi từ topic nguồn sang topic đích qua PostgreSQL Stored Procedure `public.move_topic_content` thực thi trong 1 **SQL Transaction block** với cơ chế ROLLBACK 100% khi lỗi.
  - Tab 2: Quản lý Trình độ (Levels) - Thêm/sửa danh mục trình độ động (`350+`, `500+`, `650+`, `800+`, `900+`, ...).
- **Single Source of Truth Taxonomy Service (`lib/taxonomy.ts`)**:
  - Loại bỏ 100% các mảng/enum cứng hardcode trong toàn bộ dự án (`admin.ts`, `bulk-actions.ts`, `BulkEditModal.tsx`, `content/page.tsx`, `/learn`, `/practice`).
  - Cung cấp các helper tập trung: `getActiveTopics()`, `getAllTopics()`, `getActiveLevels()`, `getAllLevels()`, `validateTopicCode()`, `validateLevelCode()`, `revalidateTaxonomyCache()`.
- **Tích hợp Giao diện Học viên & Admin**:
  - Trang `/learn`: Thêm bộ lọc Topic động phía trên danh sách bài học và Badge Topic trên từng thẻ bài học. Bài học chưa gắn topic được gom vào nhóm **"📂 Chung"**.
  - Trang `/learn/vocabulary`: Nạp danh mục topic active tự động, ẩn các topic `is_active = false`.
  - Trang `/today`: Bảo toàn tuyệt đối luồng ôn tập SRS — các từ vựng thuộc topic bị ẩn vẫn xuất hiện ôn tập bình thường khi đến hạn.
  - Trang `/practice`: Nạp dropdown Topic và Level động vào form chọn Luyện từ vựng.
  - Trang `/admin/content`: Bổ sung cột Chủ đề hiển thị `display_name` tiếng Việt kèm emoji cho bảng câu hỏi và trường chọn Topic cho bài học.
- **Migrations mới**:
  - `006_dynamic_taxonomy.sql`: Nâng cấp `topics`, tạo `levels`, ràng buộc FK `level_tag` & `topic`, cấu hình RLS policies.
  - `007_move_topic_content_rpc.sql`: Khai báo PL/pgSQL Stored Procedure `move_topic_content`.

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
