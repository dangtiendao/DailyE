import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle, Sparkles } from 'lucide-react';

// Landing Page chính của ứng dụng DailyE
export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6">
      {/* Navigation Bar đơn giản */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/30">
            E
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
            DailyE
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Đăng nhập
          </Link>
          <Link
            href="/today"
            className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-md shadow-blue-600/30"
          >
            Học ngay
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-3xl mx-auto w-full text-center space-y-8 my-auto py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Nền tảng học & luyện thi TOEIC hoàn toàn miễn phí</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          <span className="block text-white">DailyE</span>
          <span className="block mt-2 bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
            Học đúng lỗi sai, tiến bộ mỗi ngày
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Tối ưu hóa thời gian ôn luyện TOEIC Part 1-7 với hệ thống phân tích sổ lỗi sai thông minh và phương pháp lặp lại ngắt quãng (SRS).
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/today"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/40 flex items-center justify-center gap-2 text-base"
          >
            <span>Bắt đầu học miễn phí</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/learn"
            className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2 text-base"
          >
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>Khám phá bài học</span>
          </Link>
        </div>

        {/* Highlight features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl">
            <CheckCircle className="w-6 h-6 text-blue-400 mb-2" />
            <h3 className="font-bold text-white text-sm">Chữa đúng lỗi sai</h3>
            <p className="text-xs text-slate-400 mt-1">Lưu trữ tự động các câu làm sai và nhắc nhở ôn tập ngắt quãng.</p>
          </div>

          <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl">
            <CheckCircle className="w-6 h-6 text-indigo-400 mb-2" />
            <h3 className="font-bold text-white text-sm">Đầy đủ Part 1 - 7</h3>
            <p className="text-xs text-slate-400 mt-1">Kho câu hỏi thực chiến chuẩn cấu trúc đề thi TOEIC mới nhất.</p>
          </div>

          <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl">
            <CheckCircle className="w-6 h-6 text-sky-400 mb-2" />
            <h3 className="font-bold text-white text-sm">Lộ trình theo mục tiêu</h3>
            <p className="text-xs text-slate-400 mt-1">Đo lường tiến độ và gợi ý nhiệm vụ học tập theo từng mục tiêu điểm.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 py-4 border-t border-slate-800">
        © 2026 DailyE. Tất cả quyền được bảo lưu. Học & Luyện thi TOEIC Miễn Phí.
      </footer>
    </div>
  );
}
