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
  getAdminVocabItems,
  toggleVocabStatus,
  upsertAdminVocabItem,
  deleteAdminVocabItem,
  UpsertQuestionInput,
  UpsertLessonInput,
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
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'questions' | 'lessons' | 'vocab'>('questions');

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

  // Vocab State
  const [vocabItems, setVocabItems] = useState<any[]>([]);
  const [isVocabLoading, setIsVocabLoading] = useState(true);
  const [vocabFilters, setVocabFilters] = useState({
    topic: 'all',
    level: 'all',
    status: 'all',
  });
  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [editingVocab, setEditingVocab] = useState<any | null>(null);

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

  // Tải danh sách từ vựng
  const loadVocabItems = async () => {
    setIsVocabLoading(true);
    try {
      const res = await getAdminVocabItems(vocabFilters);
      if (res.success && res.items) {
        setVocabItems(res.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVocabLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'questions') {
      loadQuestions();
    } else if (activeTab === 'lessons') {
      loadLessons();
    } else {
      loadVocabItems();
    }
  }, [activeTab, filters.examPart, filters.status, filters.levelTag, vocabFilters.topic, vocabFilters.level, vocabFilters.status]);

  // Toggle Status Vocab
  const handleToggleVocabStatus = async (id: number, currentStatus: string) => {
    const res = await toggleVocabStatus(id, currentStatus);
    if (res.success) {
      loadVocabItems();
    }
  };

  // Delete Vocab
  const handleDeleteVocab = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa từ vựng này khỏi hệ thống?')) return;
    const res = await deleteAdminVocabItem(id);
    if (res.success) {
      loadVocabItems();
    }
  };

  // Submit Vocab Form
  const handleSaveVocab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemData = {
      id: editingVocab?.id,
      word: String(formData.get('word') || ''),
      word_type: String(formData.get('word_type') || 'n'),
      meaning_vi: String(formData.get('meaning_vi') || ''),
      example: String(formData.get('example') || ''),
      example_blank: String(formData.get('example_blank') || ''),
      topic: String(formData.get('topic') || 'office'),
      level_tag: String(formData.get('level_tag') || '500+'),
      status: String(formData.get('status') || 'draft') as 'draft' | 'published',
    };

    const res = await upsertAdminVocabItem(itemData);
    if (res.success) {
      setIsVocabModalOpen(false);
      setEditingVocab(null);
      loadVocabItems();
    } else {
      alert('Lỗi lưu từ vựng');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/dashboard" className="text-xs text-slate-500 hover:underline inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Về Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nội dung hệ thống</h1>
          <p className="text-xs text-slate-500">Quản lý kho Câu hỏi TOEIC, Bài học Markdown và Từ vựng Active Recall</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'questions' && (
            <button
              onClick={() => {
                setEditingQuestion(null);
                setIsQuestionModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Thêm câu hỏi mới
            </button>
          )}

          {activeTab === 'vocab' && (
            <button
              onClick={() => {
                setEditingVocab(null);
                setIsVocabModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Thêm từ vựng mới
            </button>
          )}
        </div>
      </header>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('questions')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2',
            activeTab === 'questions'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>1. Câu hỏi TOEIC</span>
        </button>

        <button
          onClick={() => setActiveTab('lessons')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2',
            activeTab === 'lessons'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>2. Bài học Markdown</span>
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2',
            activeTab === 'vocab'
              ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>3. Từ vựng Active Recall</span>
        </button>
      </div>

      {/* TAB 3: TỪ VỰNG ACTIVE RECALL */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>Bộ lọc:</span>
            </div>

            {/* Filter Topic */}
            <select
              value={vocabFilters.topic}
              onChange={(e) => setVocabFilters({ ...vocabFilters, topic: e.target.value })}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="all">Tất cả chủ đề</option>
              <option value="office">🏢 Office</option>
              <option value="hr">👥 HR</option>
              <option value="finance">💰 Finance</option>
              <option value="marketing">📢 Marketing</option>
              <option value="travel">✈️ Travel</option>
            </select>

            {/* Filter Level */}
            <select
              value={vocabFilters.level}
              onChange={(e) => setVocabFilters({ ...vocabFilters, level: e.target.value })}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="all">Tất cả Level</option>
              <option value="350+">350+</option>
              <option value="500+">500+</option>
              <option value="650+">650+</option>
              <option value="800+">800+</option>
            </select>

            {/* Filter Status */}
            <select
              value={vocabFilters.status}
              onChange={(e) => setVocabFilters({ ...vocabFilters, status: e.target.value })}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="all">Tất cả Trạng thái</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Vocab Table */}
          {isVocabLoading ? (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-sm">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Đang nạp danh sách từ vựng...</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Từ vựng (Word)</th>
                      <th className="p-3">Loại từ</th>
                      <th className="p-3">Nghĩa tiếng Việt</th>
                      <th className="p-3">Ví dụ</th>
                      <th className="p-3">Chủ đề</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vocabItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-extrabold text-slate-900">{item.word}</td>
                        <td className="p-3 font-bold text-indigo-600">({item.word_type})</td>
                        <td className="p-3 font-medium">{item.meaning_vi}</td>
                        <td className="p-3 max-w-xs truncate text-slate-500 italic">{item.example}</td>
                        <td className="p-3 font-mono">{item.topic}</td>
                        <td className="p-3">{item.level_tag}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleVocabStatus(item.id, item.status)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1',
                              item.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            )}
                          >
                            {item.status === 'published' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{item.status}</span>
                          </button>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingVocab(item);
                              setIsVocabModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVocab(item.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL EDIT/CREATE VOCAB ITEM */}
      {isVocabModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingVocab ? 'Chỉnh sửa Từ vựng' : 'Thêm Từ vựng mới'}
              </h3>
              <button onClick={() => setIsVocabModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVocab} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Từ vựng (word)</label>
                  <input
                    name="word"
                    defaultValue={editingVocab?.word || ''}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Loại từ (word_type)</label>
                  <select
                    name="word_type"
                    defaultValue={editingVocab?.word_type || 'n'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="n">n (Danh từ)</option>
                    <option value="v">v (Động từ)</option>
                    <option value="adj">adj (Tính từ)</option>
                    <option value="adv">adv (Phó từ)</option>
                    <option value="phrase">phrase (Cụm từ)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nghĩa tiếng Việt (meaning_vi)</label>
                <input
                  name="meaning_vi"
                  defaultValue={editingVocab?.meaning_vi || ''}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Ví dụ ngữ cảnh (example)</label>
                <textarea
                  name="example"
                  defaultValue={editingVocab?.example || ''}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Chủ đề</label>
                  <select
                    name="topic"
                    defaultValue={editingVocab?.topic || 'office'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="office">office</option>
                    <option value="hr">hr</option>
                    <option value="finance">finance</option>
                    <option value="marketing">marketing</option>
                    <option value="travel">travel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Level</label>
                  <select
                    name="level_tag"
                    defaultValue={editingVocab?.level_tag || '500+'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="350+">350+</option>
                    <option value="500+">500+</option>
                    <option value="650+">650+</option>
                    <option value="800+">800+</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Trạng thái</label>
                  <select
                    name="status"
                    defaultValue={editingVocab?.status || 'draft'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsVocabModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
