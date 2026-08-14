'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTargetScore } from '@/app/actions/auth';
import { Award, ArrowRight, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { TargetScoreSelector } from '@/components/shared/target-score-selector';
import { cn } from '@/lib/utils';


// Màn hình Onboarding 2 bước cho học viên mới
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedScore, setSelectedScore] = useState<number>(500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNextStep = () => {
    setStep(2);
  };

  const handleCompleteOnboarding = async (wantsTestNow: boolean) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await updateTargetScore(selectedScore);

    if (!result.success) {
      setErrorMsg(result.error || 'Cập nhật mục tiêu thất bại');
      setIsSubmitting(false);
      return;
    }

    if (wantsTestNow) {
      router.push('/today?notice=placement_test_soon');
    } else {
      router.push('/today');
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Progress indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
              {step}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bước {step} / 2
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className={cn("w-8 h-2 rounded-full transition-all", step >= 1 ? "bg-blue-600" : "bg-slate-200")} />
            <div className={cn("w-8 h-2 rounded-full transition-all", step >= 2 ? "bg-blue-600" : "bg-slate-200")} />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* BƯỚC 1: Chọn mục tiêu điểm TOEIC */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
                Mục tiêu của bạn là gì?
              </h1>
              <p className="text-xs text-slate-500">
                DailyE sẽ cá nhân hóa bài tập và lộ trình ôn luyện theo mục tiêu này.
              </p>
            </div>

            <TargetScoreSelector
              selectedScore={selectedScore}
              onSelectScore={setSelectedScore}
            />

            <button
              onClick={handleNextStep}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* BƯỚC 2: Test đầu vào */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-2">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Kiểm tra trình độ đầu vào?</h1>
              <p className="text-xs text-slate-500">
                Làm bài test nhanh 15 phút để đo chính xác trình độ hiện tại của bạn.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-800">Mục tiêu đã chọn: {selectedScore}+ TOEIC</span>
              </div>
              <p className="text-slate-500">
                Bạn có thể làm bài test ngay bây giờ hoặc bắt đầu học các chủ đề trọng tâm trước.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCompleteOnboarding(true)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Bắt đầu test đầu vào</span>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCompleteOnboarding(false)}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition disabled:opacity-50"
              >
                Để sau, vào học ngay!
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
