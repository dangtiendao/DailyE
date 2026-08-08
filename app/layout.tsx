import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'DailyE - Webapp Học & Luyện thi TOEIC miễn phí',
    template: '%s | DailyE',
  },
  description: 'Học đúng lỗi sai, tiến bộ mỗi ngày. Webapp luyện thi TOEIC Part 5, 6, 7 miễn phí với thuật toán lặp lại ngắt quãng SRS Leitner & Sổ lỗi sai thông minh.',
  keywords: ['TOEIC', 'luyện thi TOEIC', 'học tiếng Anh miễn phí', 'TOEIC Part 5', 'TOEIC Part 7', 'Sổ lỗi sai', 'SRS Leitner', 'DailyE'],
  openGraph: {
    title: 'DailyE - Webapp Học & Luyện thi TOEIC miễn phí',
    description: 'Học đúng lỗi sai, tiến bộ mỗi ngày cùng DailyE',
    siteName: 'DailyE',
    locale: 'vi_VN',
    type: 'website',
  },
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col antialiased bg-slate-50 text-slate-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
