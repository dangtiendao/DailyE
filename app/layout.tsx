import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DailyE - Học & Luyện thi TOEIC miễn phí",
  description: "Học đúng lỗi sai, tiến bộ mỗi ngày cùng DailyE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col antialiased bg-slate-50 text-slate-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
