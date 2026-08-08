import React from 'react';
import Link from 'next/link';
import { Layers, Clock, AlertOctagon, ArrowRight, Tag, Lock, Sparkles, ChevronRight } from 'lucide-react';

const KNOWLEDGE_TAGS = [
  { tag: 'Grammar', label: 'Ngữ pháp tổng hợp', count: '15 câu' },
  { tag: 'Parts of Speech', label: 'Từ loại (Noun, Adj, Adv)', count: '12 câu' },
  { tag: 'Prepositions', label: 'Giới từ & Cụm giới từ', count: '10 câu' },
  { tag: 'To-Infinitive', label: 'Động từ nguyên mẫu (To-V)', count: '8 câu' },
  { tag: 'Vocabulary', label: 'Từ vựng doanh nghiệp', count: '20 câu' },
];

// Trang chọn chế độ Luyện đề TOEIC /practice
export default function PracticeModePage() {
  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Luyện đề TOEIC</h1>
          <p className="text-xs text-slate-500">Luyện tập theo Part, Chủ điểm & Mini Test</p>
        </div>
        <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl">
          <Layers className="w-6 h-6" />
        </div>
      </header>

      {/* CHẾ ĐỘ 1: MINI TEST 20 PHÚT */}
      <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-5 text-white shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Chế độ thi thử nhanh</span>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">⏱️ Mini Test 20 câu (20 phút)</h2>
        <p className="text-xs text-emerald-100 leading-relaxed max-w-sm">
          Đề thi hỗn hợp 20 câu có đồng hồ đếm ngược. Đánh giá chính xác phản xạ làm bài dưới áp lực thời gian.
        </p>
        <Link
          href="/practice/session?mode=mini"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-emerald-700 font-bold rounded-2xl text-xs transition shadow-md"
        >
          <span>Bắt đầu Mini Test</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* CHẾ ĐỘ 2: LUYỆN THEO PART */}
      <section className="space-y-3">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <span>📝 Luyện theo Part</span>
        </h2>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Part 5 */}
          <Link
            href="/practice/session?part=part5"
            className="p-4 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-sm flex items-center justify-between transition group cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition">
                  Part 5: Hoàn thành câu (Incomplete Sentences)
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">
                  Text
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Kiểm tra ngữ pháp và từ vựng trong câu đơn</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 text-emerald-600 transition" />
          </Link>

          {/* Part 6 */}
          <Link
            href="/practice/session?part=part6"
            className="p-4 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-sm flex items-center justify-between transition group cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition">
                  Part 6: Điền đoạn văn (Text Completion)
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">
                  Text
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Điền từ và điền câu vào ngữ cảnh đoạn văn</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 text-emerald-600 transition" />
          </Link>

          {/* Part 7 */}
          <Link
            href="/practice/session?part=part7"
            className="p-4 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-sm flex items-center justify-between transition group cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition">
                  Part 7: Đọc hiểu đoạn văn (Reading Comprehension)
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">
                  Text
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Đoạn đơn, đoạn đôi & đoạn ba</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 text-emerald-600 transition" />
          </Link>

          {/* Part Nghe (Disabled) */}
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl opacity-65 flex items-center justify-between cursor-not-allowed">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 text-sm">Part 1, 2, 3, 4: Các phần Nghe (Listening)</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Sắp ra mắt
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Đang phát triển file Audio ở các phase sau</p>
            </div>
          </div>
        </div>
      </section>

      {/* CHẾ ĐỘ 3: LUYỆN THEO CHỦ ĐIỂM (KNOWLEDGE TAGS) */}
      <section className="space-y-3">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <span>🏷️ Luyện theo Chủ điểm Ngữ pháp / Từ vựng</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {KNOWLEDGE_TAGS.map((item) => (
            <Link
              key={item.tag}
              href={`/practice/session?tag=${encodeURIComponent(item.tag)}`}
              className="p-3.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-sm flex items-center justify-between transition group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-800 text-xs group-hover:text-emerald-600 transition">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-slate-400">{item.count}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
