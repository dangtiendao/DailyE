'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { parseExcelImport, commitExcelImport } from '@/app/actions/admin';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Trang Admin Import đề thi Excel / CSV xử lý hoàn toàn trên Server Action với SheetJS + Zod
export default function AdminImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [parseResult, setParseResult] = useState<any | null>(null);
  const [commitSuccessMsg, setCommitSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setParseResult(null);
      setCommitSuccessMsg(null);
      setErrorMessage(null);
    }
  };

  const handleParseFile = async (e: React.FormEvent) => {
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
        setErrorMessage(res.error || 'Lỗi kiểm tra file Excel');
      } else {
        setParseResult(res);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi đọc file trên Server');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!parseResult || !parseResult.validRowsToInsert || parseResult.validRowsToInsert.length === 0) {
      return;
    }

    setIsCommitting(true);
    setErrorMessage(null);

    try {
      const res = await commitExcelImport(parseResult.validRowsToInsert, parseResult.filename);
      if (!res.success) {
        setErrorMessage(res.error || 'Lỗi nhập dữ liệu vào Database');
      } else {
        setCommitSuccessMsg(`Đã nhập thành công ${res.count} câu hỏi hợp lệ vào Database (Trạng thái Draft)!`);
        setParseResult(null);
        setSelectedFile(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi ghi dữ liệu vào Server');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/dashboard" className="text-xs text-slate-500 hover:underline inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Về Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Import đề thi bằng Excel / CSV</h1>
          <p className="text-xs text-slate-500">Tải lên file câu hỏi định dạng .xlsx hoặc .csv (Đọc trên Server Action bằng SheetJS)</p>
        </div>

        <a
          href="/templates/dailye_questions_template.xlsx"
          download="dailye_questions_template.xlsx"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Tải file Excel mẫu (.xlsx)</span>
        </a>
      </header>

      {/* Alert Thông báo Lỗi / Thành công */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {commitSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{commitSuccessMsg}</span>
        </div>
      )}

      {/* Upload Zone Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 max-w-3xl">
        <form onSubmit={handleParseFile} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center space-y-3 transition relative bg-slate-50/50">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Kéo thả file Excel vào đây hoặc nhấp để chọn'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Hỗ trợ các định dạng .xlsx, .xls, .csv</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={!selectedFile || isParsing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đọc và validate file trên Server...</span>
                </>
              ) : (
                <span>Kiểm tra & Xem trước file</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* PREVIEW TABLE KẾT QUẢ PARSE FILE */}
      {parseResult && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Kết quả xem trước (Preview)</h2>
              <p className="text-xs text-slate-500">File: {parseResult.filename}</p>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl">
                Tổng: {parseResult.totalRows} dòng
              </span>
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
                Hợp lệ: {parseResult.validCount} dòng
              </span>
              <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl">
                Lỗi: {parseResult.invalidCount} dòng
              </span>
            </div>
          </div>

          {/* Bảng chi tiết từng dòng */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-500">
                <tr>
                  <th className="p-3">Hàng Excel</th>
                  <th className="p-3">Mã (Code)</th>
                  <th className="p-3">Part</th>
                  <th className="p-3">Nội dung câu hỏi</th>
                  <th className="p-3">Đáp án</th>
                  <th className="p-3">Trạng thái Validation</th>
                  <th className="p-3">Lý do lỗi / Cảnh báo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parseResult.results.map((row: any) => (
                  <tr
                    key={row.rowIndex}
                    className={cn(
                      'transition',
                      row.isValid ? 'hover:bg-emerald-50/50' : 'bg-red-50/40 hover:bg-red-50'
                    )}
                  >
                    <td className="p-3 font-bold text-slate-500">Hàng {row.rowIndex}</td>
                    <td className="p-3 font-bold text-slate-900">{row.data?.code || 'N/A'}</td>
                    <td className="p-3 uppercase font-semibold text-slate-700">{row.data?.exam_part || 'N/A'}</td>
                    <td className="p-3 max-w-xs truncate">{row.data?.question_text || 'N/A'}</td>
                    <td className="p-3 font-bold text-blue-600">{row.data?.correct_answer || 'N/A'}</td>
                    <td className="p-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold text-[11px]">
                          <Check className="w-3.5 h-3.5" /> Hợp lệ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      {row.errors.length > 0 && (
                        <ul className="list-disc list-inside text-red-600 font-medium space-y-0.5">
                          {row.errors.map((err: string, i: number) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      )}
                      {row.warnings.length > 0 && (
                        <div className="text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{row.warnings.join(', ')}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Commit Button */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Các câu hỏi hợp lệ sẽ được lưu vào cơ sở dữ liệu với trạng thái mặc định là <span className="font-bold text-amber-600">Draft</span>.
            </p>

            <button
              type="button"
              disabled={isCommitting || parseResult.validCount === 0}
              onClick={handleCommitImport}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu dữ liệu vào DB...</span>
                </>
              ) : (
                <span>Nhập {parseResult.validCount} dòng hợp lệ vào Database</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
