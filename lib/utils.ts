import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Hàm hỗ trợ gộp class CSS Tailwind an toàn
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
