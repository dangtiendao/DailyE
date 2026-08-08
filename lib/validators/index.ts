import { z } from 'zod';

// Zod schema kiểm tra thông tin Đăng nhập
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
});

// Zod schema kiểm tra thông tin Đăng ký
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

// Zod schema mẫu cho việc Import dữ liệu câu hỏi từ Excel/CSV (dành cho Part 5, 6, 7)
export const excelQuestionImportSchema = z.object({
  part: z.number().min(1).max(7),
  questionText: z.string().min(1, 'Nội dung câu hỏi không được để trống'),
  optionA: z.string().min(1, 'Lựa chọn A không được để trống'),
  optionB: z.string().min(1, 'Lựa chọn B không được để trống'),
  optionC: z.string().min(1, 'Lựa chọn C không được để trống'),
  optionD: z.string().min(1, 'Lựa chọn D không được để trống'),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  audioUrl: z.string().url().nullable().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ExcelQuestionImportInput = z.infer<typeof excelQuestionImportSchema>;
