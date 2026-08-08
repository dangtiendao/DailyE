'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getQuestions,
  toggleQuestionStatus,
  deleteQuestion,
  upsertQuestion,
  getLessons,
  upsertLesson,
  deleteLesson,
} from '@/app/actions/admin';
import {
  FileText,
  BookOpen,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Trang Quản lý nội dung (Quản lý Câu hỏi TOEIC & Bài học Markdown)
export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'questions' | 'lessons'>('questions');

  // Question State
  const [questions, setQuestions] = useState<any[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);
  const [filters, setFilters] = useState({
    examPart: 'all',
    status: 'all',
    levelTag: 'all',
    search: '',
  });

  // Modal Question Editor State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Lesson State
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLessonsLoading, setIsLessonsLoading] = useState(true);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [markdownPreview, setMarkdownPreview] = useState(false);

  // Tải danh sách câu hỏi
  const loadQuestions = async () => {
    setIsQuestionsLoading(true);
    try {
      const data = await getQuestions(filters);
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  // Tải danh sách bài học
  const loadLessons = async () => {
    setIsLessonsLoading(true);
    try {
      const data = await getLessons();
      setLessons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLessonsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'questions') {
      loadQuestions();
    } else {
      loadLessons();
    }
  }, [activeTab, filters.examPart, filters.status, filters.levelTag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuestions();
  };

  // Toggle Draft <-> Published
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const res = await toggleQuestionStatus(id, currentStatus);
    if (res.success) {
      loadQuestions();
    }
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = async (id: string, code: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa câu hỏi '${code}' không?`)) {
      const res = await deleteQuestion(id);
      if (res.success) {
        loadQuestions();
      }
    }
  };

  // Lưu câu hỏi
  const handleSaveQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      id: editingQuestion?.id,
      code: String(formData.get('code') || '').trim(),
      exam_part: String(formData.get('exam_part') || 'part5') as any,
      question_text: String(formData.get('question_text') || '').trim(),
      options: {
        A: String(formData.get('optionA') || '').trim(),
        B: String(formData.get('optionB') || '').trim(),
        C: String(formData.get('optionC') || '').trim(),
        D: String(formData.get('optionD') || '').trim(),
      },
      correct_answer: String(formData.get('correct_answer') || 'A') as any,
      explanation: String(formData.get('explanation') || '').trim() || null,
      difficulty: String(formData.get('difficulty') || 'medium') as any,
      status: String(formData.get('status') || 'draft') as any,
    };

    const res = await upsertQuestion(payload);
    if (res.success) {
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
      loadQuestions();
    } else {
      alert(`Lỗi lưu câu hỏi: ${res.error}`);
    }
  };

  // Lưu bài học
  const handleSaveLesson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      id: editingLesson?.id,
      title: String(formData.get('title') || '').trim(),
      slug: String(formData.get('slug') || '').trim(),
      skill: String(formData.get('skill') || 'vocabulary') as any,
      status: String(formData.get('status') || 'draft') as any,
      content: String(formData.get('content') || '').trim(),
    };

    const res = await upsertLesson(payload);
    if (res.success) {
      setIsLessonModalOpen(false);
      setEditingLesson(null);
      loadLessons();
    } else {
      alert(`Lỗi lưu bài học: ${res.error}`);
    }
  };

  // Xóa bài học
  const handleDeleteLesson = async (id: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài học '${title}' không?`)) {
      const res = await deleteLesson(id);
      if (res.success) {
        loadLessons();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/dashboard" className="text-xs text-slate-500 hover:underline inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Về Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nội dung</h1>
          <p className="text-xs text-slate-500">Quản lý kho câu hỏi TOEIC và các bài học kiến thức</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'questions' ? (
            <button
              onClick={() => {
                setEditingQuestion(null);
                setIsQuestionModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Thêm câu hỏi mới
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingLesson(null);
                setIsLessonModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Thêm bài học mới
            </button>
          )}
        </div>
      </header>

      {/* Tabs Selection */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('questions')}
          className={cn(
            'py-2.5 px-4 font-bold text-sm border-b-2 transition flex items-center gap-2',
            activeTab === 'questions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Kho câu hỏi</span>
        </button>

        <button
          onClick={() => setActiveTab('lessons')}
          className={cn(
            'py-2.5 px-4 font-bold text-sm border-b-2 transition flex items-center gap-2',
            activeTab === 'lessons'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bài học</span>
        </button>
      </div>

      {/* TAB 1: CÂU HỎI */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Thanh lọc & tìm kiếm */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã câu (code) hoặc nội dung..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={filters.examPart}
                onChange={(e) => setFilters({ ...filters, examPart: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="all">Tất cả Part</option>
                <option value="part1">Part 1</option>
                <option value="part2">Part 2</option>
                <option value="part3">Part 3</option>
                <option value="part4">Part 4</option>
                <option value="part5">Part 5</option>
                <option value="part6">Part 6</option>
                <option value="part7">Part 7</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Nháp (Draft)</option>
                <option value="published">Đã đăng (Published)</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Lọc dữ liệu
              </button>
            </form>
          </div>

          {/* Bảng danh sách câu hỏi */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {isQuestionsLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Đang tải danh sách câu hỏi...</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Không tìm thấy câu hỏi nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="p-3.5">Mã câu</th>
                      <th className="p-3.5">Part</th>
                      <th className="p-3.5">Nội dung câu hỏi</th>
                      <th className="p-3.5">Đáp án đúng</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {questions.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-bold text-slate-900">{q.code}</td>
                        <td className="p-3.5">
                          <span className="uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]">
                            {q.exam_part}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-md truncate">{q.question_text}</td>
                        <td className="p-3.5 font-bold text-blue-600">{q.correct_answer}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleStatus(q.id, q.status)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition',
                              q.status === 'published'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            )}
                          >
                            {q.status === 'published' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Published
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> Draft
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingQuestion(q);
                              setIsQuestionModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id, q.code)}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BÀI HỌC */}
      {activeTab === 'lessons' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {isLessonsLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Đang tải danh sách bài học...</span>
            </div>
          ) : lessons.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Chưa có bài học nào trong hệ thống. Nhấn "Thêm bài học mới" để tạo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="p-3.5">Tiêu đề</th>
                    <th className="p-3.5">Slug</th>
                    <th className="p-3.5">Kỹ năng</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{lesson.title}</td>
                      <td className="p-3.5 text-slate-500">{lesson.slug}</td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-[11px]">
                          {lesson.skill}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
                            lesson.status === 'published'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {lesson.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingLesson(lesson);
                            setIsLessonModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL EDIT QUESTION */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">
              {editingQuestion ? `Sửa câu hỏi: ${editingQuestion.code}` : 'Thêm câu hỏi mới'}
            </h2>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mã câu hỏi (Code)</label>
                  <input
                    type="text"
                    name="code"
                    required
                    defaultValue={editingQuestion?.code || ''}
                    placeholder="P5-0001"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Part bài thi</label>
                  <select
                    name="exam_part"
                    defaultValue={editingQuestion?.exam_part || 'part5'}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="part1">Part 1</option>
                    <option value="part2">Part 2</option>
                    <option value="part3">Part 3</option>
                    <option value="part4">Part 4</option>
                    <option value="part5">Part 5</option>
                    <option value="part6">Part 6</option>
                    <option value="part7">Part 7</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Nội dung câu hỏi</label>
                <textarea
                  name="question_text"
                  required
                  rows={3}
                  defaultValue={editingQuestion?.question_text || ''}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lựa chọn A</label>
                  <input
                    type="text"
                    name="optionA"
                    required
                    defaultValue={editingQuestion?.options?.A || ''}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lựa chọn B</label>
                  <input
                    type="text"
                    name="optionB"
                    required
                    defaultValue={editingQuestion?.options?.B || ''}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lựa chọn C</label>
                  <input
                    type="text"
                    name="optionC"
                    required
                    defaultValue={editingQuestion?.options?.C || ''}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lựa chọn D</label>
                  <input
                    type="text"
                    name="optionD"
                    required
                    defaultValue={editingQuestion?.options?.D || ''}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Đáp án đúng</label>
                  <select
                    name="correct_answer"
                    defaultValue={editingQuestion?.correct_answer || 'A'}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Độ khó</label>
                  <select
                    name="difficulty"
                    defaultValue={editingQuestion?.difficulty || 'medium'}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="easy">Dễ (Easy)</option>
                    <option value="medium">Vừa (Medium)</option>
                    <option value="hard">Khó (Hard)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select
                    name="status"
                    defaultValue={editingQuestion?.status || 'draft'}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="draft">Nháp (Draft)</option>
                    <option value="published">Đã đăng (Published)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Lời giải chi tiết</label>
                <textarea
                  name="explanation"
                  rows={2}
                  defaultValue={editingQuestion?.explanation || ''}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT LESSON */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">
              {editingLesson ? `Sửa bài học: ${editingLesson.title}` : 'Thêm bài học mới'}
            </h2>

            <form onSubmit={handleSaveLesson} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tiêu đề bài học</label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingLesson?.title || ''}
                    placeholder="Từ vựng TOEIC Chủ đề Marketing"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Slug URL</label>
                  <input
                    type="text"
                    name="slug"
                    required
                    defaultValue={editingLesson?.slug || ''}
                    placeholder="tu-vung-marketing"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kỹ năng</label>
                  <select
                    name="skill"
                    defaultValue={editingLesson?.skill || 'vocabulary'}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="vocabulary">Từ vựng (Vocabulary)</option>
                    <option value="grammar">Ngữ pháp (Grammar)</option>
                    <option value="listening">Lắng nghe (Listening)</option>
                    <option value="reading">Đọc hiểu (Reading)</option>
                    <option value="strategy">Chiến thuật làm bài (Strategy)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select
                    name="status"
                    defaultValue={editingLesson?.status || 'draft'}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="draft">Nháp (Draft)</option>
                    <option value="published">Đã đăng (Published)</option>
                  </select>
                </div>
              </div>

              {/* Editor Markdown & Preview Tab */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-medium text-slate-700">Nội dung bài học (Markdown)</label>
                  <button
                    type="button"
                    onClick={() => setMarkdownPreview(!markdownPreview)}
                    className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {markdownPreview ? 'Hiện Editor' : 'Xem trước Preview'}
                  </button>
                </div>

                {!markdownPreview ? (
                  <textarea
                    name="content"
                    required
                    rows={8}
                    defaultValue={editingLesson?.content || ''}
                    placeholder="# Tiêu đề Markdown&#10;Nội dung kiến thức bài học..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[200px] whitespace-pre-wrap font-sans text-xs">
                    {editingLesson?.content || 'Chưa có nội dung xem trước'}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold"
                >
                  Lưu bài học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
