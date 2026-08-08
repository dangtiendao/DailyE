import React from 'react';
import { BottomNav } from '@/components/shared/bottom-nav';

// Layout chung cho nhóm màn hình người học (Learner), tích hợp Bottom Navigation 5 tab
export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative pb-20">
      {/* Khung nội dung chính với giới hạn max-width tương thích mobile & desktop */}
      <main className="flex-1 max-w-md w-full mx-auto p-4">
        {children}
      </main>
      
      {/* Bottom Navigation Bar cố định ở đáy màn hình */}
      <BottomNav />
    </div>
  );
}
