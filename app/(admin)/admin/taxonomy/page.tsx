'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getAdminTaxonomyData,
  createTopic,
  updateTopic,
  toggleTopicActive,
  deleteTopic,
  moveTopicContent,
  createLevel,
  updateLevel,
  toggleLevelActive,
  deleteLevel,
} from '@/lib/admin/taxonomy-actions';
import { TopicItem, LevelItem } from '@/lib/taxonomy';
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoveRight,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  HelpCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminTaxonomyPage() {
  const [activeTab, setActiveTab] = useState<'topics' | 'levels'>('topics');
  const [isLoading, setIsLoading] = useState(true);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [levels, setLevels] = useState<LevelItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Modal State cho Topic
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);

  // Modal State cho Level
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelItem | null>(null);

  // Modal State Cảnh báo Ẩn Topic
  const [hideConfirmTopic, setHideConfirmTopic] = useState<TopicItem | null>(null);

  // Modal State Chuyển nội dung Topic
  const [moveModalTopic, setMoveModalTopic] = useState<TopicItem | null>(null);
  const [moveTargetCode, setMoveTargetCode] = useState<string>('');
  const [moveTypes, setMoveTypes] = useState<{ vocabulary: boolean; lessons: boolean; questions: boolean }>({
    vocabulary: true,
    lessons: true,
    questions: true,
  });
  const [isMoving, setIsMoving] = useState(false);

  // Load dữ liệu Taxonomy
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminTaxonomyData();
      if (!res.success) {
        setErrorMessage(res.error || 'Lỗi tải dữ liệu taxonomy');
      } else {
        setTopics(res.topics);
        setLevels(res.levels);
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearAlerts = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setWarningMessage(null);
  };

  // ------------------------------------------------------------------------------
  // HANDLERS CHO TOPICS
  // ------------------------------------------------------------------------------

  const handleSaveTopic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearAlerts();
    const formData = new FormData(e.currentTarget);
    const code = String(formData.get('code') || '').trim();
    const display_name = String(formData.get('display_name') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const order_index = Number(formData.get('order_index') || 0);

    if (editingTopic) {
      // Update Topic
      const res = await updateTopic(editingTopic.code, { display_name, description, order_index });
      if (!res.success) {
        setErrorMessage(res.error || 'Lỗi cập nhật Topic');
      } else {
        setSuccessMessage(res.message || 'Cập nhật thành công');
        setIsTopicModalOpen(false);
        setEditingTopic(null);
        loadData();
      }
    } else {
      // Create Topic
      const res = await createTopic({ code, display_name, description, order_index });
      if (!res.success) {
        setErrorMessage(res.error || 'Lỗi tạo Topic');
      } else {
        setSuccessMessage(res.message || 'Tạo thành công');
        if (res.warning) setWarningMessage(res.warning);
        setIsTopicModalOpen(false);
        setEditingTopic(null);
        loadData();
      }
    }
  };

  const handleToggleTopic = async (topic: TopicItem) => {
    clearAlerts();
    const newStatus = !topic.is_active;

    // Nếu tắt (ẩn) topic mà đang có nội dung -> Hiển thị popup xác nhận an toàn
    const totalLinked = (topic.vocab_count || 0) + (topic.lesson_count || 0) + (topic.question_count || 0);
    if (!newStatus && totalLinked > 0) {
      setHideConfirmTopic(topic);
      return;
    }

    const res = await toggleTopicActive(topic.code, newStatus);
    if (!res.success) {
      setErrorMessage(res.error || 'Lỗi đổi trạng thái');
    } else {
      setSuccessMessage(res.message || 'Đổi trạng thái thành công');
      loadData();
    }
  };

  const confirmHideTopic = async () => {
    if (!hideConfirmTopic) return;
    clearAlerts();
    const res = await toggleTopicActive(hideConfirmTopic.code, false);
    setHideConfirmTopic(null);
    if (!res.success) {
      setErrorMessage(res.error || 'Lỗi ẩn Topic');
    } else {
      setSuccessMessage(res.message || 'Đã ẩn Topic thành công');
      loadData();
    }
  };

  const handleDeleteTopic = async (topic: TopicItem) => {
    clearAlerts();
    const res = await deleteTopic(topic.code);
    if (!res.success) {
      setErrorMessage(res.error || 'Không thể xóa Topic');
    } else {
      setSuccessMessage(res.message || 'Đã xóa Topic');
      loadData();
    }
  };

  const handleMoveTopicContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveModalTopic || !moveTargetCode) return;
    clearAlerts();
    setIsMoving(true);

    const selectedTypes: Array<'vocabulary' | 'lessons' | 'questions'> = [];
    if (moveTypes.vocabulary) selectedTypes.push('vocabulary');
    if (moveTypes.lessons) selectedTypes.push('lessons');
    if (moveTypes.questions) selectedTypes.push('questions');

    try {
      const res = await moveTopicContent(moveModalTopic.code, moveTargetCode, selectedTypes);
      if (!res.success) {
        setErrorMessage(res.error || 'Lỗi di chuyển nội dung');
      } else {
        setSuccessMessage(res.message || 'Di chuyển thành công');
        setMoveModalTopic(null);
        loadData();
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsMoving(false);
    }
  };

  const handleOrderTopic = async (topic: TopicItem, direction: 'up' | 'down') => {
    clearAlerts();
    const newOrder = direction === 'up' ? topic.order_index - 1 : topic.order_index + 1;
    const res = await updateTopic(topic.code, {
      display_name: topic.display_name,
      description: topic.description || undefined,
      order_index: newOrder,
    });
    if (res.success) loadData();
  };

  // ------------------------------------------------------------------------------
  // HANDLERS CHO LEVELS
  // ------------------------------------------------------------------------------

  const handleSaveLevel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearAlerts();
    const formData = new FormData(e.currentTarget);
    const code = String(formData.get('code') || '').trim();
    const display_name = String(formData.get('display_name') || '').trim();
    const order_index = Number(formData.get('order_index') || 0);

    if (editingLevel) {
      const res = await updateLevel(editingLevel.code, { display_name, order_index });
      if (!res.success) {
        setErrorMessage(res.error || 'Lỗi cập nhật Level');
      } else {
        setSuccessMessage(res.message || 'Cập nhật thành công');
        setIsLevelModalOpen(false);
        setEditingLevel(null);
        loadData();
      }
    } else {
      const res = await createLevel({ code, display_name, order_index });
      if (!res.success) {
        setErrorMessage(res.error || 'Lỗi tạo Level');
      } else {
        setSuccessMessage(res.message || 'Tạo thành công');
        setIsLevelModalOpen(false);
        setEditingLevel(null);
        loadData();
      }
    }
  };

  const handleToggleLevel = async (level: LevelItem) => {
    clearAlerts();
    const res = await toggleLevelActive(level.code, !level.is_active);
    if (!res.success) {
      setErrorMessage(res.error || 'Lỗi đổi trạng thái Level');
    } else {
      setSuccessMessage(res.message || 'Đổi trạng thái thành công');
      loadData();
    }
  };

  const handleDeleteLevel = async (level: LevelItem) => {
    clearAlerts();
    const res = await deleteLevel(level.code);
    if (!res.success) {
      setErrorMessage(res.error || 'Không thể xóa Level');
    } else {
      setSuccessMessage(res.message || 'Đã xóa Level');
      loadData();
    }
  };

  const handleOrderLevel = async (level: LevelItem, direction: 'up' | 'down') => {
    clearAlerts();
    const newOrder = direction === 'up' ? level.order_index - 1 : level.order_index + 1;
    const res = await updateLevel(level.code, {
      display_name: level.display_name,
      order_index: newOrder,
    });
    if (res.success) loadData();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Navigation */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/dashboard" className="text-xs text-slate-500 hover:underline inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Về Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            🏷️ Quản lý Taxonomy Toàn Hệ Thống
          </h1>
          <p className="text-xs text-slate-500">Quản lý danh mục Chủ đề (Topics) & Trình độ (Levels) dùng chung cho Từ vựng, Bài học & Câu hỏi</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/import?tab=taxonomy"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            📥 Import Taxonomy
          </Link>

          {activeTab === 'topics' ? (
            <button
              onClick={() => {
                setEditingTopic(null);
                setIsTopicModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Thêm Topic mới
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingLevel(null);
                setIsLevelModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Thêm Level mới
            </button>
          )}
        </div>
      </header>

      {/* Thông báo Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 font-bold hover:text-rose-700">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 font-bold hover:text-emerald-700">✕</button>
        </div>
      )}

      {warningMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{warningMessage}</span>
          </div>
          <button onClick={() => setWarningMessage(null)} className="text-amber-500 font-bold hover:text-amber-700">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('topics')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2',
            activeTab === 'topics'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>📚 Chủ đề (Topics) ({topics.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('levels')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2',
            activeTab === 'levels'
              ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <Layers className="w-4 h-4" />
          <span>📊 Level Trình độ (Levels) ({levels.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Đang nạp bảng dữ liệu Taxonomy...</p>
        </div>
      ) : activeTab === 'topics' ? (
        /* TAB 1: BẢNG CHỦ ĐỀ (TOPICS) */
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden space-y-4 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="p-3 w-12 text-center">Thứ tự</th>
                  <th className="p-3">Mã Code (PK)</th>
                  <th className="p-3">Tên hiển thị</th>
                  <th className="p-3 max-w-xs">Mô tả</th>
                  <th className="p-3">Nội dung đang gắn</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topics.map((t, idx) => {
                  const totalLinked = (t.vocab_count || 0) + (t.lesson_count || 0) + (t.question_count || 0);

                  return (
                    <tr key={t.code} className={cn('hover:bg-slate-50/80 transition', !t.is_active && 'opacity-60 bg-slate-50/50')}>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold text-slate-600">{t.order_index}</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleOrderTopic(t, 'up')}
                              className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Tăng thứ tự"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={idx === topics.length - 1}
                              onClick={() => handleOrderTopic(t, 'down')}
                              className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Giảm thứ tự"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-extrabold text-blue-700">{t.code}</td>
                      <td className="p-3 font-bold text-slate-900">{t.display_name}</td>
                      <td className="p-3 text-slate-500 truncate max-w-xs">{t.description || '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-bold">
                            🔤 {t.vocab_count || 0} từ
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-bold">
                            📘 {t.lesson_count || 0} bài
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-bold">
                            📝 {t.question_count || 0} câu
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleTopic(t)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1',
                            t.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          )}
                        >
                          {t.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{t.is_active ? 'Hoạt động' : 'Đã ẩn'}</span>
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingTopic(t);
                            setIsTopicModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Sửa thông tin Topic"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {totalLinked > 0 ? (
                          <button
                            onClick={() => {
                              setMoveModalTopic(t);
                              const firstOther = topics.find((ot) => ot.code !== t.code && ot.is_active);
                              setMoveTargetCode(firstOther?.code || '');
                            }}
                            className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition font-bold text-[11px] inline-flex items-center gap-1"
                            title="Di chuyển dữ liệu sang Topic khác"
                          >
                            <MoveRight className="w-3 h-3" />
                            <span>Chuyển data ({totalLinked})</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteTopic(t)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa cứng Topic (Vì rỗng data)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: BẢNG LEVEL TRÌNH ĐỘ (LEVELS) */
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden space-y-4 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="p-3 w-12 text-center">Thứ tự</th>
                  <th className="p-3">Mã Code (PK)</th>
                  <th className="p-3">Tên hiển thị</th>
                  <th className="p-3">Nội dung đang gắn</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {levels.map((l, idx) => {
                  const totalLinked = (l.vocab_count || 0) + (l.lesson_count || 0) + (l.question_count || 0);

                  return (
                    <tr key={l.code} className={cn('hover:bg-slate-50/80 transition', !l.is_active && 'opacity-60 bg-slate-50/50')}>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold text-slate-600">{l.order_index}</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleOrderLevel(l, 'up')}
                              className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={idx === levels.length - 1}
                              onClick={() => handleOrderLevel(l, 'down')}
                              className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-extrabold text-indigo-700">{l.code}</td>
                      <td className="p-3 font-bold text-slate-900">{l.display_name}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-bold">
                            🔤 {l.vocab_count || 0} từ
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-bold">
                            📘 {l.lesson_count || 0} bài
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-bold">
                            📝 {l.question_count || 0} câu
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleLevel(l)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1',
                            l.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          )}
                        >
                          {l.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{l.is_active ? 'Hoạt động' : 'Đã ẩn'}</span>
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingLevel(l);
                            setIsLevelModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Sửa thông tin Level"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          disabled={totalLinked > 0}
                          onClick={() => handleDeleteLevel(l)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title={totalLinked > 0 ? `Đang chứa ${totalLinked} bản ghi, hãy chuyển sang ẩn` : 'Xóa cứng Level này'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA TOPIC */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTopic ? `Sửa Topic: ${editingTopic.code}` : 'Thêm Topic mới'}
              </h3>
              <button onClick={() => setIsTopicModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  Mã Topic Code (PK)
                  {editingTopic && <span className="text-slate-400 font-normal">(Không thể thay đổi mã PK)</span>}
                </label>
                <input
                  name="code"
                  defaultValue={editingTopic?.code || ''}
                  readOnly={!!editingTopic}
                  placeholder="Ví dụ: logistics, retail, IT"
                  required
                  className={cn(
                    'w-full p-2.5 border rounded-xl font-mono text-xs',
                    editingTopic ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed font-bold' : 'bg-slate-50 border-slate-200'
                  )}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tên hiển thị (display_name)</label>
                <input
                  name="display_name"
                  defaultValue={editingTopic?.display_name || ''}
                  placeholder="Ví dụ: 🚚 Vận tải & Logistics"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mô tả ngắn (description)</label>
                <textarea
                  name="description"
                  defaultValue={editingTopic?.description || ''}
                  placeholder="Mô tả nội dung chủ đề từ vựng và ngữ cảnh bài học..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Thứ tự hiển thị (order_index)</label>
                <input
                  type="number"
                  name="order_index"
                  defaultValue={editingTopic?.order_index ?? (topics.length + 1)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button type="button" onClick={() => setIsTopicModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Hủy
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA LEVEL */}
      {isLevelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingLevel ? `Sửa Level: ${editingLevel.code}` : 'Thêm Level mới'}
              </h3>
              <button onClick={() => setIsLevelModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveLevel} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  Mã Level Code (PK)
                  {editingLevel && <span className="text-slate-400 font-normal">(Không thể thay đổi mã PK)</span>}
                </label>
                <input
                  name="code"
                  defaultValue={editingLevel?.code || ''}
                  readOnly={!!editingLevel}
                  placeholder="Ví dụ: 900+, C1"
                  required
                  className={cn(
                    'w-full p-2.5 border rounded-xl font-mono text-xs',
                    editingLevel ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed font-bold' : 'bg-slate-50 border-slate-200'
                  )}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tên hiển thị (display_name)</label>
                <input
                  name="display_name"
                  defaultValue={editingLevel?.display_name || ''}
                  placeholder="Ví dụ: 🏆 800 → 900+ Cao cấp"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Thứ tự hiển thị (order_index)</label>
                <input
                  type="number"
                  name="order_index"
                  defaultValue={editingLevel?.order_index ?? (levels.length + 1)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button type="button" onClick={() => setIsLevelModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Hủy
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CẢNH BÁO KHI ẨN TOPIC CÓ NỘI DUNG */}
      {hideConfirmTopic && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Xác nhận Ẩn Topic "{hideConfirmTopic.display_name}"?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-2xl p-4">
              Topic này hiện có <strong>{hideConfirmTopic.vocab_count || 0} từ vựng</strong>, <strong>{hideConfirmTopic.lesson_count || 0} bài học</strong> và <strong>{hideConfirmTopic.question_count || 0} câu hỏi</strong>.
              <br /><br />
              • Khi Ẩn: Topic sẽ không xuất hiện với người học và không nhận file import mới.
              <br />
              • Các từ vựng đã học thuộc topic này <strong>VẪN ĐƯỢC ÓN TẬP BÌNH THƯỜNG</strong> qua hệ thống SRS Leitner.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button onClick={() => setHideConfirmTopic(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs">
                Hủy
              </button>
              <button onClick={confirmHideTopic} className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-md">
                Đồng ý Ẩn Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DI CHUYỂN NỘI DUNG TOPIC */}
      {moveModalTopic && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <MoveRight className="w-5 h-5 text-amber-600" />
                <span>Chuyển nội dung từ "{moveModalTopic.display_name}"</span>
              </h3>
              <button onClick={() => setMoveModalTopic(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleMoveTopicContent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Chọn Topic Đích (Nhận dữ liệu)</label>
                <select
                  value={moveTargetCode}
                  onChange={(e) => setMoveTargetCode(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                >
                  <option value="" disabled>-- Chọn Topic Đích --</option>
                  {topics
                    .filter((t) => t.code !== moveModalTopic.code && t.is_active)
                    .map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.display_name} ({t.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-slate-700">Loại nội dung muốn di chuyển:</label>

                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={moveTypes.vocabulary}
                      onChange={(e) => setMoveTypes({ ...moveTypes, vocabulary: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>🔤 Từ vựng ({moveModalTopic.vocab_count || 0} từ)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={moveTypes.lessons}
                      onChange={(e) => setMoveTypes({ ...moveTypes, lessons: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>📘 Bài học Markdown ({moveModalTopic.lesson_count || 0} bài)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={moveTypes.questions}
                      onChange={(e) => setMoveTypes({ ...moveTypes, questions: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>📝 Câu hỏi TOEIC ({moveModalTopic.question_count || 0} câu)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button type="button" onClick={() => setMoveModalTopic(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isMoving || !moveTargetCode}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md flex items-center gap-2"
                >
                  {isMoving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Xác nhận Di chuyển Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
