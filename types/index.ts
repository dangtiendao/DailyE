// Định nghĩa các loại quyền truy cập người dùng trong hệ thống
export type AccessLevel = 'free' | 'premium' | 'admin';

// Định nghĩa thông tin User rút gọn
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  accessLevel: AccessLevel;
  targetScore?: number;
  createdAt: string;
}

// Các Part của bài thi TOEIC (Part 1 - 7)
export type TOEICPart = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Định nghĩa giao diện câu hỏi TOEIC (Nội dung TEXT ưu tiên giai đoạn 1)
export interface Question {
  id: string;
  part: TOEICPart;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  // Media URL nullable theo yêu cầu thiết kế giai đoạn đầu
  imageUrl?: string | null;
  audioUrl?: string | null;
}

// Định nghĩa thông tin bài học từ vựng/ngữ pháp
export interface Lesson {
  id: string;
  title: string;
  category: 'vocabulary' | 'grammar';
  description: string;
  content: string;
}
