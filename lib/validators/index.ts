import { z } from 'zod';

// Zod schema kiểm tra thông tin Đăng nhập (Yêu cầu mật khẩu tối thiểu 8 ký tự)
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải chứa ít nhất 8 ký tự'),
});

// Zod schema kiểm tra thông tin Đăng ký
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải chứa ít nhất 8 ký tự'),
  confirmPassword: z.string().min(8, 'Mật khẩu xác nhận phải có ít nhất 8 ký tự'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

// Zod schema kiểm tra chọn Mục tiêu điểm TOEIC trong Onboarding
export const onboardingSchema = z.object({
  targetScore: z.coerce.number().refine((val) => [350, 500, 650, 800, 900].includes(val), {
    message: 'Mục tiêu điểm không hợp lệ (Chọn 350, 500, 650, 800 hoặc 900)',
  }),
});

// Zod schema mẫu cho việc Import dữ liệu câu hỏi từ Excel/CSV (Part 5, 6, 7)
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
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ExcelQuestionImportInput = z.infer<typeof excelQuestionImportSchema>;

// Zod schema cập nhật Họ và tên
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ và tên không vượt quá 50 ký tự'),
});

// Zod schema đổi mật khẩu (User đã đăng nhập)
export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Mật khẩu mới phải chứa ít nhất 8 ký tự'),
    confirmPassword: z.string().min(8, 'Mật khẩu xác nhận phải chứa ít nhất 8 ký tự'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

// Zod schema gửi email quên mật khẩu
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

// Zod schema đặt lại mật khẩu từ recovery link
export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Mật khẩu mới phải chứa ít nhất 8 ký tự'),
    confirmPassword: z.string().min(8, 'Mật khẩu xác nhận phải chứa ít nhất 8 ký tự'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

// Zod schema cập nhật mục tiêu học hàng ngày (phút)
export const dailyGoalSchema = z.object({
  dailyGoalMinutes: z.coerce.number().min(5, 'Tối thiểu 5 phút').max(240, 'Tối đa 240 phút'),
});

// Zod schema xác nhận xóa tài khoản
export const deleteAccountSchema = z.object({
  confirmEmail: z.string().email('Email không hợp lệ'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type DailyGoalInput = z.infer<typeof dailyGoalSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// Zod schema lọc danh sách User của Admin
export const adminUserListSchema = z.object({
  search: z.string().optional().default(''),
  accessLevel: z.enum(['all', 'free', 'premium', 'admin']).optional().default('all'),
  status: z.enum(['all', 'active', 'banned']).optional().default('all'),
  sortBy: z.enum(['created_at', 'full_name']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(100).optional().default(20),
});

// Zod schema đổi quyền hạn (Role) của User
export const updateUserRoleSchema = z.object({
  userId: z.string().uuid('User ID không hợp lệ'),
  newRole: z.enum(['free', 'premium', 'admin']),
  confirmEmail: z.string().optional(),
});

// Zod schema khóa tài khoản (Ban User)
export const banUserSchema = z.object({
  userId: z.string().uuid('User ID không hợp lệ'),
  reason: z.string().trim().min(10, 'Lý do khóa phải chứa ít nhất 10 ký tự'),
});

// Zod schema mở khóa tài khoản (Unban User)
export const unbanUserSchema = z.object({
  userId: z.string().uuid('User ID không hợp lệ'),
});

// Zod schema Admin xóa tài khoản User
export const deleteUserByAdminSchema = z.object({
  userId: z.string().uuid('User ID không hợp lệ'),
  confirmEmail: z.string().email('Email xác nhận không hợp lệ'),
});

export type AdminUserListInput = z.infer<typeof adminUserListSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type UnbanUserInput = z.infer<typeof unbanUserSchema>;
export type DeleteUserByAdminInput = z.infer<typeof deleteUserByAdminSchema>;


