'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  parseExcelImport,
  commitExcelImport,
  parseVocabExcelImport,
  commitVocabExcelImport,
  ParsedVocabImportRow,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ImportTab = 'questions' | 'vocab';

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
        ) : (
          <a
            href="/templates/dailye_vocab_template.csv"
            download="dailye_vocab_template.csv"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            Tải mẫu CSV Từ vựng (.csv)
          </a>
        )}
      </header>

      {/* Navigation Tabs */}
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
          <FileSpreadsheet className="w-4 h-4" />
          <span>1. Import Câu hỏi TOEIC</span>
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
          <span>2. Import Từ vựng TOEIC</span>
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
    </div>
  );
}
