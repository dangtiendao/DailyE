# 📘 DailyE - Webapp Học & Luyện thi TOEIC Miễn phí

> **Slogan**: *"Học đúng lỗi sai, tiến bộ mỗi ngày"*

DailyE là nền tảng webapp học kiến thức và luyện thi TOEIC tối ưu cho học viên Việt Nam với triết lý tập trung khắc phục điểm yếu thông qua **Sổ lỗi sai thông minh** và **Thuật toán Lặp lại ngắt quãng (SRS Leitner)**.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Lucide Icons
- **State & Form**: React Query (`@tanstack/react-query`) + React Hook Form + Zod validation
- **Backend & Database**: Supabase (PostgreSQL, Authentication, Row Level Security RLS)
- **Import Excel**: SheetJS (`xlsx`) + Zod validate trực tiếp trên Server Action
- **Deploy**: Vercel

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

## 🗄️ Hướng dẫn Chạy SQL Migrations trên Supabase

Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard) -> Chọn dự án của bạn -> Mở **SQL Editor** và chạy lần lượt **3 file Migration** theo đúng thứ tự:

1. **`supabase/migrations/001_init.sql`**: Khởi tạo 12 bảng cơ sở dữ liệu, Trigger tự tạo Profile, RLS Policies và SAFE VIEW `published_questions_safe`.
2. **`supabase/migrations/002_lesson_progress.sql`**: Khởi tạo bảng `lesson_progress` theo dõi tiến độ bài học.
3. **`supabase/migrations/003_srs_and_streak.sql`**: Bổ sung theo dõi 2 lần đúng liên tiếp trong `error_logs`, chuỗi ngày học liên tiếp (`streak_count`) trong `profiles` và các chỉ mục Index.

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
- `/admin/content`: Quản lý câu hỏi & bài học Markdown
- `/admin/import`: Nhập liệu hàng loạt bằng file Excel/CSV

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

## 📋 Checklist 10 Mục "Smoke Test" Sau Khi Deploy Production

Sau khi hoàn tất Deploy, tiến hành kiểm thử nhanh 10 mục quan trọng nhất:

| # | Mục Kiểm Thử (Smoke Test) | Trạng Thái Kỳ Vọng |
|---|---|---|
| 1 | **Trang Landing Page (`/`)** | Hiển thị thương hiệu DailyE, khẩu hiệu và các nút Đăng nhập / Đăng ký. |
| 2 | **Đăng ký / Đăng nhập Email (`/register`, `/login`)** | Tạo tài khoản thành công, tự chuyển hướng sang `/onboarding`. |
| 3 | **Onboarding 2 bước (`/onboarding`)** | Chọn được mục tiêu điểm TOEIC và lưu thành công vào `profiles`. |
| 4 | **Quyền Admin (`/admin/dashboard`)** | Tài khoản có `access_level = 'admin'` vào được Dashboard, tài khoản `free` bị đuổi về `/today`. |
| 5 | **Import Excel (`/admin/import`)** | Tải file Excel mẫu chuẩn, upload lên Server Action phân tích 0 lỗi và commit lưu thành công vào DB. |
| 6 | **Học bài kiến thức (`/learn/[slug]`)** | Render chuẩn định dạng Markdown bài học, nhấn "Đánh dấu đã học xong" đổi màu badge live. |
| 7 | **Flashcards từ vựng (`/learn/vocabulary`)** | Lật thẻ mặt trước/sau trơn tru, bấm "Chưa nhớ" từ tự động lặp lại ở cuối phiên. |
| 8 | **Luyện đề Quiz Engine (`/practice/session`)** | Đề thi hiển thị an toàn không lộ đáp án, đếm giờ chạy chuẩn, nộp bài thành công. |
| 9 | **Trang Kết quả (`/practice/result/[attemptId]`)** | Hiển thị đúng điểm số %, lộ lời giải chi tiết và gợi ý bài học đối với các tag bị sai. |
| 10 | **Sổ lỗi sai (`/practice/errors`) & Streak (`/today`)** | Câu làm sai xuất hiện trong Sổ lỗi sai, trả lời đúng 2 lần liên tiếp chuyển `resolved = true` và Streak 🔥 tăng số ngày. |
