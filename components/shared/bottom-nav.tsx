'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Home, BookOpen, FileSpreadsheet, BarChart2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  todayQueryOptions,
  learnQueryOptions,
  progressQueryOptions,
  taxonomyQueryOptions,
} from '@/lib/query-options';

// Khai báo danh sách 5 Tab chính của khu vực Learner
const NAV_ITEMS = [
  {
    label: 'Hôm nay',
    href: '/today',
    icon: Home,
  },
  {
    label: 'Học',
    href: '/learn',
    icon: BookOpen,
  },
  {
    label: 'Luyện',
    href: '/practice',
    icon: FileSpreadsheet,
  },
  {
    label: 'Tiến độ',
    href: '/progress',
    icon: BarChart2,
  },
  {
    label: 'Cá nhân',
    href: '/profile',
    icon: User,
  },
];

// Component Thanh Điều Hướng Phía Dưới (Bottom Navigation Bar - Mobile-first)
export function BottomNav() {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Hàm prefetch dữ liệu theo ngữ cảnh tab khi di chuột (onMouseEnter) hoặc chạm (onTouchStart)
  const handlePrefetch = (href: string) => {
    if (href === '/today') {
      queryClient.prefetchQuery(todayQueryOptions());
    } else if (href === '/learn') {
      queryClient.prefetchQuery(learnQueryOptions('all'));
    } else if (href === '/progress') {
      queryClient.prefetchQuery(progressQueryOptions());
    } else if (href === '/practice') {
      queryClient.prefetchQuery(taxonomyQueryOptions());
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname ? (pathname === item.href || pathname.startsWith(`${item.href}/`)) : false;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => handlePrefetch(item.href)}
              onTouchStart={() => handlePrefetch(item.href)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 px-2 text-xs transition-colors duration-200 rounded-xl',
                isActive
                  ? 'text-blue-600 font-semibold bg-blue-50/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-1 transition-transform', isActive && 'scale-110')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
