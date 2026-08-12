'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  parseExcelImport,
  commitExcelImport,
  parseVocabExcelImport,
  commitVocabExcelImport,
  parseLessonsImport,
  commitLessonsImport,
  parseLessonQuestionsImport,
  commitLessonQuestionsImport,
  parseTestsImport,
  commitTestsImport,
  parseTaxonomyImport,
  commitTaxonomyImport,
  ParsedVocabImportRow,
  ParsedLessonImportRow,
  ParsedLessonQuestionRow,
  ParsedTestImportResult,
  ParsedTopicImportRow,
  ParsedLevelImportRow,
} from '@/app/actions/admin';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  BookOpen,
  Sparkles,
  FileCode,
  Eye,
  X,
  Link2,
  FileCheck2,
  FolderTree,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ImportTab = 'questions' | 'vocab' | 'lessons' | 'lesson_questions' | 'tests' | 'taxonomy';

export default function AdminImportPage() {
  const [activeTab, setActiveTab] = useState<ImportTab>('questions');

  // State cho Tab Câu hỏi TOEIC
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [parseResult, setParseResult] = useState<any | null>(null);
  const [commitSuccessMsg, setCommitSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State cho Tab Từ vựng TOEIC
  const [selectedVocabFile, setSelectedVocabFile] = useState<File | null>(null);
  const [isParsingVocab, setIsParsingVocab] = useState(false);
  const [isCommittingVocab, setIsCommittingVocab] = useState(false);
  const [vocabParseResult, setVocabParseResult] = useState<any | null>(null);
  const [vocabCommitSuccessMsg, setVocabCommitSuccessMsg] = useState<string | null>(null);
  const [vocabErrorMessage, setVocabErrorMessage] = useState<string | null>(null);

  // State cho Tab Bài học (.md + YAML Frontmatter)
  const [selectedLessonFiles, setSelectedLessonFiles] = useState<File[]>([]);
  const [isParsingLessons, setIsParsingLessons] = useState(false);
  const [isCommittingLessons, setIsCommittingLessons] = useState(false);
  const [lessonParseResult, setLessonParseResult] = useState<any | null>(null);
  const [lessonCommitSuccessMsg, setLessonCommitSuccessMsg] = useState<string | null>(null);
  const [lessonErrorMessage, setLessonErrorMessage] = useState<string | null>(null);
  const [previewLessonModalContent, setPreviewLessonModalContent] = useState<{ title: string; filename: string; content: string } | null>(null);

  // State cho Tab 4: Liên kết Bài học - Câu hỏi (lesson_questions)
  const [selectedLQFile, setSelectedLQFile] = useState<File | null>(null);
  const [isParsingLQ, setIsParsingLQ] = useState(false);
  const [isCommittingLQ, setIsCommittingLQ] = useState(false);
  const [lqParseResult, setLqParseResult] = useState<any | null>(null);
  const [lqCommitSuccessMsg, setLqCommitSuccessMsg] = useState<string | null>(null);
  const [lqErrorMessage, setLqErrorMessage] = useState<string | null>(null);

  // State cho Tab 5: Import Đề thi (tests & test_questions)
  const [selectedTestsFile, setSelectedTestsFile] = useState<File | null>(null);
  const [isParsingTests, setIsParsingTests] = useState(false);
  const [isCommittingTests, setIsCommittingTests] = useState(false);
  const [testsParseResult, setTestsParseResult] = useState<any | null>(null);
  const [testsCommitSuccessMsg, setTestsCommitSuccessMsg] = useState<string | null>(null);
  const [testsErrorMessage, setTestsErrorMessage] = useState<string | null>(null);

  // State cho Tab 6: Import Taxonomy (topics & levels)
  const [selectedTaxonomyFile, setSelectedTaxonomyFile] = useState<File | null>(null);
  const [isParsingTaxonomy, setIsParsingTaxonomy] = useState(false);
  const [isCommittingTaxonomy, setIsCommittingTaxonomy] = useState(false);
  const [taxonomyParseResult, setTaxonomyParseResult] = useState<any | null>(null);
  const [taxonomyCommitSuccessMsg, setTaxonomyCommitSuccessMsg] = useState<string | null>(null);
  const [taxonomyErrorMessage, setTaxonomyErrorMessage] = useState<string | null>(null);

  // Parse Câu hỏi
  const handleParseQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsParsing(true);
    setErrorMessage(null);
    setCommitSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await parseExcelImport(formData);
      if (!res.success) {
        setErrorMessage(res.error || 'Lỗi kiểm tra file Excel câu hỏi');
      } else {
        setParseResult(res);
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Lỗi đọc file trên Server');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitQuestions = async () => {
    if (!parseResult || !parseResult.validRowsToInsert || parseResult.validRowsToInsert.length === 0) return;

    setIsCommitting(true);
    setErrorMessage(null);

    try {
      const res = await commitExcelImport(parseResult.validRowsToInsert, parseResult.filename);
      if (!res.success) {
        setErrorMessage(res.error || 'Lỗi nhập câu hỏi vào Database');
      } else {
        setCommitSuccessMsg(`Đã nhập thành công ${res.count} câu hỏi hợp lệ vào Database (Trạng thái Draft)!`);
        setParseResult(null);
        setSelectedFile(null);
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Lỗi ghi dữ liệu vào Server');
    } finally {
      setIsCommitting(false);
    }
  };

  // Parse Từ vựng
  const handleParseVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVocabFile) return;

    setIsParsingVocab(true);
    setVocabErrorMessage(null);
    setVocabCommitSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedVocabFile);

    try {
      const res = await parseVocabExcelImport(formData);
      if (!res.success) {
        setVocabErrorMessage(res.error || 'Lỗi kiểm tra file Excel từ vựng');
      } else {
        setVocabParseResult(res);
      }
    } catch (err) {
      setVocabErrorMessage((err as Error).message || 'Lỗi đọc file từ vựng trên Server');
    } finally {
      setIsParsingVocab(false);
    }
  };

  const handleCommitVocab = async () => {
    if (!vocabParseResult || !vocabParseResult.validRowsToInsert || vocabParseResult.validRowsToInsert.length === 0) return;

    setIsCommittingVocab(true);
    setVocabErrorMessage(null);

    try {
      const res = await commitVocabExcelImport(vocabParseResult.validRowsToInsert, vocabParseResult.filename);
      if (!res.success) {
        setVocabErrorMessage(res.error || 'Lỗi nhập từ vựng vào Database');
      } else {
        setVocabCommitSuccessMsg(`Đã nhập thành công ${res.count} từ vựng hợp lệ vào Database (Trạng thái Draft)!`);
        setVocabParseResult(null);
        setSelectedVocabFile(null);
      }
    } catch (err) {
      setVocabErrorMessage((err as Error).message || 'Lỗi ghi dữ liệu vào Server');
    } finally {
      setIsCommittingVocab(false);
    }
  };
  const handleParseLessons = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonFiles || selectedLessonFiles.length === 0) return;

    setIsParsingLessons(true);
    setLessonErrorMessage(null);
    setLessonCommitSuccessMsg(null);

    const formData = new FormData();
    selectedLessonFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await parseLessonsImport(formData);
      if (!res.success) {
        setLessonErrorMessage(res.error || 'Lỗi kiểm tra danh sách file Bài học .md');
      } else {
        setLessonParseResult(res);
      }
    } catch (err) {
      setLessonErrorMessage((err as Error).message || 'Lỗi xử lý file .md trên Server');
    } finally {
      setIsParsingLessons(false);
    }
  };

  const handleCommitLessons = async () => {
    if (!lessonParseResult || !lessonParseResult.validRowsToInsert || lessonParseResult.validRowsToInsert.length === 0) return;

    setIsCommittingLessons(true);
    setLessonErrorMessage(null);

    try {
      const res = await commitLessonsImport(lessonParseResult.validRowsToInsert, lessonParseResult.batchName);
      if (!res.success) {
        setLessonErrorMessage(res.error || 'Lỗi nhập bài học vào Database');
      } else {
        setLessonCommitSuccessMsg(`Đã nhập thành công ${res.count} bài học hợp lệ vào Database (Trạng thái Draft)!`);
        setLessonParseResult(null);
        setSelectedLessonFiles([]);
      }
    } catch (err) {
      setLessonErrorMessage((err as Error).message || 'Lỗi ghi dữ liệu vào Server');
    } finally {
      setIsCommittingLessons(false);
    }
  };

  // Parse Liên kết Bài học - Câu hỏi
  const handleParseLQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLQFile) return;

    setIsParsingLQ(true);
    setLqErrorMessage(null);
    setLqCommitSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedLQFile);

    try {
      const res = await parseLessonQuestionsImport(formData);
      if (!res.success) {
        setLqErrorMessage(res.error || 'Lỗi kiểm tra file liên kết');
      } else {
        setLqParseResult(res);
      }
    } catch (err) {
      setLqErrorMessage((err as Error).message || 'Lỗi đọc file liên kết trên Server');
    } finally {
      setIsParsingLQ(false);
    }
  };

  const handleCommitLQ = async () => {
    if (!lqParseResult || !lqParseResult.validRowsToInsert || lqParseResult.validRowsToInsert.length === 0) return;

    setIsCommittingLQ(true);
    setLqErrorMessage(null);

    try {
      const res = await commitLessonQuestionsImport(lqParseResult.validRowsToInsert, lqParseResult.filename);
      if (!res.success) {
        setLqErrorMessage(res.error || 'Lỗi nhập liên kết vào Database');
      } else {
        setLqCommitSuccessMsg(`Đã chèn thành công ${res.count} liên kết Bài học ↔ Câu hỏi vào DB!`);
        setLqParseResult(null);
        setSelectedLQFile(null);
      }
    } catch (err) {
      setLqErrorMessage((err as Error).message || 'Lỗi ghi dữ liệu vào Server');
    } finally {
      setIsCommittingLQ(false);
    }
  };

  // Parse Import Đề thi TOEIC
  const handleParseTests = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestsFile) return;

    setIsParsingTests(true);
    setTestsErrorMessage(null);
    setTestsCommitSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedTestsFile);

    try {
      const res = await parseTestsImport(formData);
      if (!res.success) {
        setTestsErrorMessage(res.error || 'Lỗi kiểm tra file Excel đề thi');
      } else {
        setTestsParseResult(res);
      }
    } catch (err) {
      setTestsErrorMessage((err as Error).message || 'Lỗi đọc file đề thi trên Server');
    } finally {
      setIsParsingTests(false);
    }
  };

  const handleCommitTests = async () => {
    if (!testsParseResult || !testsParseResult.validTestsToInsert || testsParseResult.validTestsToInsert.length === 0) return;

    setIsCommittingTests(true);
    setTestsErrorMessage(null);

    try {
      const res = await commitTestsImport(testsParseResult.validTestsToInsert, testsParseResult.filename);
      if (!res.success) {
        setTestsErrorMessage(res.error || 'Lỗi nhập đề thi vào Database');
      } else {
        setTestsCommitSuccessMsg(`Đã nhập thành công ${res.count} bộ đề thi hợp lệ vào Database (Trạng thái Draft)!`);
        setTestsParseResult(null);
        setSelectedTestsFile(null);
      }
    } catch (err) {
      setTestsErrorMessage((err as Error).message || 'Lỗi ghi dữ liệu vào Server');
    } finally {
      setIsCommittingTests(false);
    }
  };

  // Parse Import Taxonomy (topics & levels)
  const handleParseTaxonomy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaxonomyFile) return;

    setIsParsingTaxonomy(true);
    setTaxonomyErrorMessage(null);
    setTaxonomyCommitSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedTaxonomyFile);

    try {
      const res = await parseTaxonomyImport(formData);
      if (!res.success) {
        setTaxonomyErrorMessage(res.error || 'Lỗi kiểm tra file Taxonomy');
      } else {
        setTaxonomyParseResult(res);
      }
    } catch (err) {
      setTaxonomyErrorMessage((err as Error).message || 'Lỗi đọc file Taxonomy trên Server');
    } finally {
      setIsParsingTaxonomy(false);
    }
  };

  const handleCommitTaxonomy = async () => {
    if (
      !taxonomyParseResult ||
      ((!taxonomyParseResult.validTopicsToInsert || taxonomyParseResult.validTopicsToInsert.length === 0) &&
        (!taxonomyParseResult.validLevelsToInsert || taxonomyParseResult.validLevelsToInsert.length === 0))
    )
      return;

    setIsCommittingTaxonomy(true);
    setTaxonomyErrorMessage(null);

    try {
      const res = await commitTaxonomyImport(
        taxonomyParseResult.validTopicsToInsert || [],
        taxonomyParseResult.validLevelsToInsert || [],
        taxonomyParseResult.filename
      );
      if (!res.success) {
        setTaxonomyErrorMessage(res.error || 'Lỗi nhập Taxonomy vào Database');
      } else {
        setTaxonomyCommitSuccessMsg(res.message || 'Import Taxonomy thành công!');
        setTaxonomyParseResult(null);
        setSelectedTaxonomyFile(null);
      }
    } catch (err) {
      setTaxonomyErrorMessage((err as Error).message || 'Lỗi ghi dữ liệu vào Server');
    } finally {
      setIsCommittingTaxonomy(false);
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
          <h1 className="text-2xl font-bold text-slate-900">Import Dữ liệu Excel / CSV</h1>
          <p className="text-xs text-slate-500">Tải lên file định dạng .xlsx hoặc .csv (Đọc & Validate trực tiếp trên Server Action)</p>
        </div>

        {activeTab === 'questions' ? (
          <a
            href="/templates/dailye_questions_template.xlsx"
            download="dailye_questions_template.xlsx"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Tải mẫu Excel Câu hỏi (.xlsx)
          </a>
        ) : activeTab === 'vocab' ? (
          <a
            href="/templates/dailye_vocab_template.csv"
            download="dailye_vocab_template.csv"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            Tải mẫu CSV Từ vựng (.csv)
          </a>
        ) : activeTab === 'lessons' ? (
          <div className="flex flex-wrap gap-2">
            <a
              href="/templates/lessons/lesson_grammar_sample.md"
              download="lesson_grammar_sample.md"
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Mẫu Ngữ Pháp (.md)
            </a>
            <a
              href="/templates/lessons/lesson_vocab_sample.md"
              download="lesson_vocab_sample.md"
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Mẫu Từ Vựng (.md)
            </a>
            <a
              href="/templates/lessons/lesson_error_sample.md"
              download="lesson_error_sample.md"
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              Mẫu Lỗi Test (.md)
            </a>
          </div>
        ) : activeTab === 'lesson_questions' ? (
          <a
            href="/templates/dailye_lesson_questions_template.xlsx"
            download="dailye_lesson_questions_template.xlsx"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-purple-600" />
            Tải mẫu Liên kết (.xlsx)
          </a>
        ) : activeTab === 'tests' ? (
          <a
            href="/templates/dailye_tests_template.xlsx"
            download="dailye_tests_template.xlsx"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-amber-600" />
            Tải mẫu Đề thi (.xlsx)
          </a>
        ) : (
          <a
            href="/templates/dailye_taxonomy_template.xlsx"
            download="dailye_taxonomy_template.xlsx"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-teal-600" />
            Tải mẫu Taxonomy (.xlsx)
          </a>
        )}
      </header>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('questions')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2 shrink-0',
            activeTab === 'questions'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>1. Import Câu hỏi</span>
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2 shrink-0',
            activeTab === 'vocab'
              ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. Import Từ vựng</span>
        </button>

        <button
          onClick={() => setActiveTab('lessons')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2 shrink-0',
            activeTab === 'lessons'
              ? 'border-emerald-600 text-emerald-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <FileCode className="w-4 h-4" />
          <span>3. Import Bài học (.md)</span>
        </button>

        <button
          onClick={() => setActiveTab('lesson_questions')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2 shrink-0',
            activeTab === 'lesson_questions'
              ? 'border-purple-600 text-purple-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <Link2 className="w-4 h-4" />
          <span>4. Liên kết Bài học ↔ Câu hỏi</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2 shrink-0',
            activeTab === 'tests'
              ? 'border-amber-600 text-amber-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>5. Import Đề thi</span>
        </button>

        <button
          onClick={() => setActiveTab('taxonomy')}
          className={cn(
            'px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2 shrink-0',
            activeTab === 'taxonomy'
              ? 'border-teal-600 text-teal-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <FolderTree className="w-4 h-4" />
          <span>6. Import Taxonomy</span>
        </button>
      </div>

      {/* TAB 1: IMPORT CÂU HỎI TOEIC */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <form onSubmit={handleParseQuestions} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Chọn file Excel / CSV chứa câu hỏi TOEIC</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <button
                type="submit"
                disabled={!selectedFile || isParsing}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Kiểm tra & Preview</span>
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {commitSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{commitSuccessMsg}</span>
            </div>
          )}

          {parseResult && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Kết quả kiểm tra: {parseResult.filename}</h3>
                  <p className="text-xs text-slate-500">
                    Tổng: {parseResult.totalRows} dòng | 合格 Hợp lệ: {parseResult.validCount} dòng | ❌ Lỗi: {parseResult.invalidCount} dòng
                  </p>
                </div>

                {parseResult.validCount > 0 && (
                  <button
                    onClick={handleCommitQuestions}
                    disabled={isCommitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    {isCommitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Nhập {parseResult.validCount} câu hợp lệ vào DB</span>
                  </button>
                )}
              </div>

              {/* Bảng Preview */}
              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Hàng</th>
                      <th className="p-3">Mã Code</th>
                      <th className="p-3">Part</th>
                      <th className="p-3">Nội dung câu hỏi</th>
                      <th className="p-3">Đáp án</th>
                      <th className="p-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parseResult.results.map((r: any) => (
                      <tr key={r.rowIndex} className={cn(r.isValid ? (r.warnings.length > 0 ? 'bg-amber-50/50' : 'bg-emerald-50/30') : 'bg-rose-50/50')}>
                        <td className="p-3 font-bold">{r.rowIndex}</td>
                        <td className="p-3 font-mono">{r.code}</td>
                        <td className="p-3">{r.examPart}</td>
                        <td className="p-3 max-w-xs truncate">{r.questionText}</td>
                        <td className="p-3 font-bold text-emerald-700">{r.correctAnswer}</td>
                        <td className="p-3 space-y-1">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Hợp lệ</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">Lỗi</span>
                          )}
                          {r.errors.map((e: string, i: number) => (
                            <p key={i} className="text-[10px] text-rose-600 font-semibold">• {e}</p>
                          ))}
                          {r.warnings.map((w: string, i: number) => (
                            <p key={i} className="text-[10px] text-amber-700 font-semibold">• {w}</p>
                          ))}
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

      {/* TAB 2: IMPORT TỪ VỰNG TOEIC */}
      {activeTab === 'vocab' && (
        <div className="space-y-6">
          <form onSubmit={handleParseVocab} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Chọn file Excel / CSV chứa Từ vựng TOEIC</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedVocabFile(e.target.files[0]);
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              <button
                type="submit"
                disabled={!selectedVocabFile || isParsingVocab}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                {isParsingVocab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Kiểm tra & Preview Từ vựng</span>
              </button>
            </div>
          </form>

          {vocabErrorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{vocabErrorMessage}</span>
            </div>
          )}

          {vocabCommitSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{vocabCommitSuccessMsg}</span>
            </div>
          )}

          {vocabParseResult && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Kết quả kiểm tra Từ vựng: {vocabParseResult.filename}</h3>
                  <p className="text-xs text-slate-500">
                    Tổng: {vocabParseResult.totalRows} dòng | 合格 Hợp lệ: {vocabParseResult.validCount} từ | ❌ Lỗi: {vocabParseResult.invalidCount} từ
                  </p>
                </div>

                {vocabParseResult.validCount > 0 && (
                  <button
                    onClick={handleCommitVocab}
                    disabled={isCommittingVocab}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    {isCommittingVocab ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Nhập {vocabParseResult.validCount} từ hợp lệ vào DB</span>
                  </button>
                )}
              </div>

              {/* Bảng Preview Từ vựng */}
              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Hàng</th>
                      <th className="p-3">Từ gốc (Word)</th>
                      <th className="p-3">Loại từ</th>
                      <th className="p-3">Nghĩa tiếng Việt</th>
                      <th className="p-3">Chủ đề (Topic)</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Trạng thái Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vocabParseResult.results.map((r: ParsedVocabImportRow) => (
                      <tr
                        key={r.rowIndex}
                        className={cn(
                          r.isValid
                            ? r.warnings.length > 0
                              ? 'bg-amber-50/50'
                              : 'bg-emerald-50/30'
                            : 'bg-rose-50/50'
                        )}
                      >
                        <td className="p-3 font-bold">{r.rowIndex}</td>
                        <td className="p-3 font-extrabold text-slate-900">{r.word}</td>
                        <td className="p-3 font-bold text-indigo-600">({r.wordType})</td>
                        <td className="p-3">{r.meaningVi}</td>
                        <td className="p-3 font-mono">{r.topic}</td>
                        <td className="p-3">{r.levelTag}</td>
                        <td className="p-3 space-y-1">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              Hợp lệ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                              Lỗi
                            </span>
                          )}
                          {r.errors.map((e, i) => (
                            <p key={i} className="text-[10px] text-rose-600 font-semibold">• {e}</p>
                          ))}
                          {r.warnings.map((w, i) => (
                            <p key={i} className="text-[10px] text-amber-700 font-semibold">• {w}</p>
                          ))}
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

      {/* TAB 3: IMPORT BÀI HỌC (.MD + YAML FRONTMATTER) */}
      {activeTab === 'lessons' && (
        <div className="space-y-6">
          <form onSubmit={handleParseLessons} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-600" />
              <span>Chọn các file Markdown (.md) chứa Bài học kèm YAML Frontmatter (Tối đa 50 file)</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                multiple
                accept=".md"
                onChange={(e) => {
                  if (e.target.files) setSelectedLessonFiles(Array.from(e.target.files));
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              <button
                type="submit"
                disabled={selectedLessonFiles.length === 0 || isParsingLessons}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                {isParsingLessons ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Kiểm tra {selectedLessonFiles.length > 0 ? `(${selectedLessonFiles.length} file)` : ''} & Preview</span>
              </button>
            </div>
          </form>

          {lessonErrorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{lessonErrorMessage}</span>
            </div>
          )}

          {lessonCommitSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{lessonCommitSuccessMsg}</span>
            </div>
          )}

          {lessonParseResult && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Kết quả kiểm tra Lô Bài học: {lessonParseResult.totalFiles} file</h3>
                  <p className="text-xs text-slate-500">
                    Tổng: {lessonParseResult.totalFiles} file | 合格 Hợp lệ: {lessonParseResult.validCount} file | ❌ Lỗi: {lessonParseResult.errorCount} file
                  </p>
                </div>

                {lessonParseResult.validCount > 0 && (
                  <button
                    onClick={handleCommitLessons}
                    disabled={isCommittingLessons}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    {isCommittingLessons ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Nhập {lessonParseResult.validCount} bài học hợp lệ vào DB</span>
                  </button>
                )}
              </div>

              {/* Bảng Preview Bài học */}
              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Tên File</th>
                      <th className="p-3">Tiêu đề (Title)</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Kỹ năng</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Topic</th>
                      <th className="p-3">Validation</th>
                      <th className="p-3 text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lessonParseResult.results.map((r: ParsedLessonImportRow, idx: number) => (
                      <tr
                        key={idx}
                        className={cn(
                          r.isValid
                            ? r.warnings.length > 0
                              ? 'bg-amber-50/50'
                              : 'bg-emerald-50/30'
                            : 'bg-rose-50/50'
                        )}
                      >
                        <td className="p-3 font-mono font-bold text-slate-900">{r.filename}</td>
                        <td className="p-3 font-bold">{r.title || '—'}</td>
                        <td className="p-3 font-mono text-emerald-800">{r.slug || '—'}</td>
                        <td className="p-3 font-semibold text-blue-600 capitalize">{r.skill || '—'}</td>
                        <td className="p-3 font-bold">{r.levelTag || '—'}</td>
                        <td className="p-3 font-mono">{r.topic || '📂 Chung'}</td>
                        <td className="p-3 space-y-1">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              Hợp lệ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                              Lỗi
                            </span>
                          )}
                          {r.errors.map((e, i) => (
                            <p key={i} className="text-[10px] text-rose-600 font-semibold">• {e}</p>
                          ))}
                          {r.warnings.map((w, i) => (
                            <p key={i} className="text-[10px] text-amber-700 font-semibold">• {w}</p>
                          ))}
                        </td>
                        <td className="p-3 text-right">
                          {r.content && (
                            <button
                              onClick={() => setPreviewLessonModalContent({ title: r.title || r.filename, filename: r.filename, content: r.content })}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition"
                            >
                              <Eye className="w-3 h-3 text-blue-600" />
                              <span>Xem Markdown</span>
                            </button>
                          )}
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

      {/* MODAL PREVIEW MARKDOWN RENDER CỦA BÀI HỌC */}
      {previewLessonModalContent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{previewLessonModalContent.title}</h3>
                <p className="text-xs text-slate-500 font-mono">File: {previewLessonModalContent.filename}</p>
              </div>
              <button
                onClick={() => setPreviewLessonModalContent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <SimpleMarkdownRenderer content={previewLessonModalContent.content} />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewLessonModalContent(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition"
              >
                Đóng Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: IMPORT LIÊN KẾT BÀI HỌC ↔ CÂU HỎI */}
      {activeTab === 'lesson_questions' && (
        <div className="space-y-6">
          <form onSubmit={handleParseLQ} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Link2 className="w-4 h-4 text-purple-600" />
              <span>Chọn file Excel / CSV chứa Liên kết Bài học (lesson_slug) ↔ Câu hỏi (question_code)</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedLQFile(e.target.files[0]);
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
              />
              <button
                type="submit"
                disabled={!selectedLQFile || isParsingLQ}
                className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                {isParsingLQ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Kiểm tra & Preview</span>
              </button>
            </div>
          </form>

          {lqErrorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{lqErrorMessage}</span>
            </div>
          )}

          {lqCommitSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{lqCommitSuccessMsg}</span>
            </div>
          )}

          {lqParseResult && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Kết quả kiểm tra Liên kết: {lqParseResult.filename}</h3>
                  <p className="text-xs text-slate-500">
                    Tổng: {lqParseResult.totalRows} dòng | 合格 Hợp lệ: {lqParseResult.validCount} dòng | ❌ Lỗi: {lqParseResult.invalidCount} dòng
                  </p>
                </div>

                {lqParseResult.validCount > 0 && (
                  <button
                    onClick={handleCommitLQ}
                    disabled={isCommittingLQ}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    {isCommittingLQ ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Nhập {lqParseResult.validCount} liên kết hợp lệ vào DB</span>
                  </button>
                )}
              </div>

              {/* Bảng Preview Liên kết */}
              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Hàng</th>
                      <th className="p-3">Lesson Slug</th>
                      <th className="p-3">Question Code</th>
                      <th className="p-3">Thứ tự (Order)</th>
                      <th className="p-3">Trạng thái Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lqParseResult.results.map((r: ParsedLessonQuestionRow) => (
                      <tr
                        key={r.rowIndex}
                        className={cn(
                          r.isValid
                            ? r.warnings.length > 0
                              ? 'bg-amber-50/50'
                              : 'bg-emerald-50/30'
                            : 'bg-rose-50/50'
                        )}
                      >
                        <td className="p-3 font-bold">{r.rowIndex}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{r.lessonSlug || '—'}</td>
                        <td className="p-3 font-mono font-bold text-purple-700">{r.questionCode || '—'}</td>
                        <td className="p-3 font-semibold">{r.orderIndex}</td>
                        <td className="p-3 space-y-1">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              Hợp lệ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                              Lỗi
                            </span>
                          )}
                          {r.errors.map((e, i) => (
                            <p key={i} className="text-[10px] text-rose-600 font-semibold">• {e}</p>
                          ))}
                          {r.warnings.map((w, i) => (
                            <p key={i} className="text-[10px] text-amber-700 font-semibold">• {w}</p>
                          ))}
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

      {/* TAB 5: IMPORT ĐỀ THI TOEIC (2 SHEETS: TESTS & TEST_QUESTIONS) */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <form onSubmit={handleParseTests} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-600" />
              <span>Chọn file Excel Đề thi (.xlsx 2 Sheets: tests & test_questions)</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedTestsFile(e.target.files[0]);
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
              />
              <button
                type="submit"
                disabled={!selectedTestsFile || isParsingTests}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                {isParsingTests ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Kiểm tra & Preview Đề thi</span>
              </button>
            </div>
          </form>

          {testsErrorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{testsErrorMessage}</span>
            </div>
          )}

          {testsCommitSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testsCommitSuccessMsg}</span>
            </div>
          )}

          {testsParseResult && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Kết quả kiểm tra Đề thi: {testsParseResult.filename}</h3>
                  <p className="text-xs text-slate-500">
                    Tổng: {testsParseResult.totalTests} bộ đề | 合格 Hợp lệ: {testsParseResult.validCount} đề | ❌ Lỗi: {testsParseResult.totalTests - testsParseResult.validCount} đề
                  </p>
                </div>

                {testsParseResult.validCount > 0 && (
                  <button
                    onClick={handleCommitTests}
                    disabled={isCommittingTests}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    {isCommittingTests ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Nhập {testsParseResult.validCount} đề thi hợp lệ vào DB</span>
                  </button>
                )}
              </div>

              {/* Bảng Preview Đề thi */}
              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Mã đề (Test Code)</th>
                      <th className="p-3">Tiêu đề (Title)</th>
                      <th className="p-3">Loại (Type)</th>
                      <th className="p-3">Thời gian (Phút)</th>
                      <th className="p-3">Số câu hỏi</th>
                      <th className="p-3">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testsParseResult.results.map((r: ParsedTestImportResult, idx: number) => (
                      <tr
                        key={idx}
                        className={cn(
                          r.isValid
                            ? r.warnings.length > 0
                              ? 'bg-amber-50/50'
                              : 'bg-emerald-50/30'
                            : 'bg-rose-50/50'
                        )}
                      >
                        <td className="p-3 font-mono font-bold text-slate-900">{r.testCode}</td>
                        <td className="p-3 font-bold">{r.title}</td>
                        <td className="p-3 uppercase font-semibold text-amber-700">{r.testType}</td>
                        <td className="p-3 font-semibold">{r.timeLimitMinutes} phút</td>
                        <td className="p-3 font-bold text-blue-600">{r.questionCount} câu</td>
                        <td className="p-3 space-y-1">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              Hợp lệ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                              Lỗi
                            </span>
                          )}
                          {r.errors.map((e, i) => (
                            <p key={i} className="text-[10px] text-rose-600 font-semibold">• {e}</p>
                          ))}
                          {r.warnings.map((w, i) => (
                            <p key={i} className="text-[10px] text-amber-700 font-semibold">• {w}</p>
                          ))}
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

      {/* TAB 6: IMPORT TAXONOMY (2 SHEETS: TOPICS & LEVELS) */}
      {activeTab === 'taxonomy' && (
        <div className="space-y-6">
          <form onSubmit={handleParseTaxonomy} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-teal-600" />
              <span>Chọn file Excel Taxonomy (.xlsx 2 Sheets: topics & levels)</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedTaxonomyFile(e.target.files[0]);
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
              <button
                type="submit"
                disabled={!selectedTaxonomyFile || isParsingTaxonomy}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                {isParsingTaxonomy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Kiểm tra & Preview Taxonomy</span>
              </button>
            </div>
          </form>

          {taxonomyErrorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{taxonomyErrorMessage}</span>
            </div>
          )}

          {taxonomyCommitSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{taxonomyCommitSuccessMsg}</span>
            </div>
          )}

          {taxonomyParseResult && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Kết quả kiểm tra Taxonomy: {taxonomyParseResult.filename}</h3>
                  <p className="text-xs text-slate-500">
                    Topics: {taxonomyParseResult.validTopicsCount}/{taxonomyParseResult.totalTopics} hợp lệ | Levels: {taxonomyParseResult.validLevelsCount}/{taxonomyParseResult.totalLevels} hợp lệ
                  </p>
                </div>

                {(taxonomyParseResult.validTopicsCount > 0 || taxonomyParseResult.validLevelsCount > 0) && (
                  <button
                    onClick={handleCommitTaxonomy}
                    disabled={isCommittingTaxonomy}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    {isCommittingTaxonomy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Nhập dòng hợp lệ vào DB</span>
                  </button>
                )}
              </div>

              {/* Bảng Topics */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>📂 Bảng Danh mục Chủ đề (Topics) ({taxonomyParseResult.topicResults.length} dòng)</span>
                </h4>
                <div className="overflow-x-auto border rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="p-3">Mã Code</th>
                        <th className="p-3">Tên hiển thị (Display Name)</th>
                        <th className="p-3">Mô tả</th>
                        <th className="p-3">Thứ tự</th>
                        <th className="p-3">Trạng thái Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {taxonomyParseResult.topicResults.map((r: ParsedTopicImportRow, idx: number) => (
                        <tr
                          key={idx}
                          className={cn(
                            r.isValid
                              ? r.isDbDuplicate
                                ? 'bg-amber-50/50'
                                : 'bg-emerald-50/30'
                              : 'bg-rose-50/50'
                          )}
                        >
                          <td className="p-3 font-mono font-bold text-slate-900">{r.code || '—'}</td>
                          <td className="p-3 font-bold">{r.displayName || '—'}</td>
                          <td className="p-3 text-slate-500 max-w-xs truncate">{r.description || '—'}</td>
                          <td className="p-3 font-semibold">{r.orderIndex}</td>
                          <td className="p-3 space-y-1">
                            {r.isValid ? (
                              r.isDbDuplicate ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                  Cập nhật Metadata
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                  Thêm mới (Active)
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                                Lỗi
                              </span>
                            )}
                            {r.errors.map((e, i) => (
                              <p key={i} className="text-[10px] text-rose-600 font-semibold">• {e}</p>
                            ))}
                            {r.warnings.map((w, i) => (
                              <p key={i} className="text-[10px] text-amber-700 font-semibold">• {w}</p>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bảng Levels */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>📊 Bảng Danh mục Trình độ (Levels) ({taxonomyParseResult.levelResults.length} dòng)</span>
                </h4>
                <div className="overflow-x-auto border rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="p-3">Mã Code</th>
                        <th className="p-3">Tên hiển thị (Display Name)</th>
                        <th className="p-3">Thứ tự</th>
                        <th className="p-3">Trạng thái Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {taxonomyParseResult.levelResults.map((r: ParsedLevelImportRow, idx: number) => (
                        <tr
                          key={idx}
                          className={cn(
                            r.isValid
                              ? r.isDbDuplicate
                                ? 'bg-amber-50/50'
                                : 'bg-emerald-50/30'
                              : 'bg-rose-50/50'
                          )}
                        >
                          <td className="p-3 font-mono font-bold text-slate-900">{r.code || '—'}</td>
                          <td className="p-3 font-bold">{r.displayName || '—'}</td>
                          <td className="p-3 font-semibold">{r.orderIndex}</td>
                          <td className="p-3 space-y-1">
                            {r.isValid ? (
                              r.isDbDuplicate ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                  Cập nhật Metadata
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                  Thêm mới (Active)
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                                Lỗi
                              </span>
                            )}
                            {r.errors.map((e, i) => (
                              <p key={i} className="text-[10px] text-rose-600 font-semibold">• {e}</p>
                            ))}
                            {r.warnings.map((w, i) => (
                              <p key={i} className="text-[10px] text-amber-700 font-semibold">• {w}</p>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple Renderer để hiển thị Markdown xem trước trong Modal
function SimpleMarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-3 text-slate-800 text-xs leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-base font-bold text-slate-900 pt-2 pb-1 border-b border-slate-200">{trimmed.replace('# ', '')}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-sm font-bold text-slate-900 pt-2">{trimmed.replace('## ', '')}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-xs font-bold text-slate-900 pt-1">{trimmed.replace('### ', '')}</h3>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="ml-4 list-disc text-slate-700">
              {trimmed.substring(2)}
            </li>
          );
        }
        if (trimmed.startsWith('```')) {
          return null;
        }
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }
        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
}
