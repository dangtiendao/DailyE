import React from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

// Trang Admin Import Excel placeholder
export default function AdminImportPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Import đề thi bằng Excel / CSV</h1>
        <p className="text-xs text-slate-500">Tải lên file câu hỏi định dạng .xlsx hoặc .csv</p>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-2xl">
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center space-y-4 cursor-pointer transition">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Kéo thả file Excel vào đây hoặc nhấp để chọn file</p>
            <p className="text-xs text-slate-400 mt-1">Hỗ trợ các định dạng .xlsx, .xls, .csv (Tối đa 10MB)</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <div className="text-xs">
            <p className="font-semibold text-slate-700">Cấu hình thư viện SheetJS (xlsx) + Zod validation đã sẵn sàng</p>
            <p className="text-slate-500">Logic xử lý file sẽ được kết nối ở phase Import Excel.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
