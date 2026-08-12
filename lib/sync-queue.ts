import { saveVocabProgress } from '@/app/actions/vocab';

// Storage Key lưu trữ tạm tiến độ SRS khi gặp sự cố mạng
const LOCAL_STORAGE_KEY = 'dailye_pending_vocab_progress';

export interface PendingProgressItem {
  vocabId: number;
  isCorrect: boolean;
  timestamp: number;
}

// 1. Lấy danh sách tiến độ chưa sync từ localStorage
export function getPendingProgressQueue(): PendingProgressItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Lỗi đọc pending queue từ localStorage:', err);
    return [];
  }
}

// 2. Thêm một bản ghi vào localStorage queue
export function savePendingProgressToLocal(vocabId: number, isCorrect: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const queue = getPendingProgressQueue();
    queue.push({ vocabId, isCorrect, timestamp: Date.now() });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Lỗi ghi pending queue vào localStorage:', err);
  }
}

// 3. Xóa danh sách pending queue đã flush thành công
export function clearPendingProgressLocal() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error('Lỗi xóa pending queue:', err);
  }
}

// 4. Đồng bộ tiến độ SRS ngầm với Auto-Retry + LocalStorage Fallback
export async function syncVocabProgressWithRetry(
  vocabId: number,
  isCorrect: boolean,
  onWarningToast?: (msg: string) => void
): Promise<boolean> {
  // Thử lần 1
  try {
    const res = await saveVocabProgress(vocabId, isCorrect);
    if (res.success) {
      // Flush luôn các bản ghi tồn đọng cũ nếu có
      flushPendingProgressQueue();
      return true;
    }
  } catch (err) {
    console.warn('Lần 1 ghi ngầm tiến độ SRS thất bại, thử lại lần 2...', err);
  }

  // Thử lại lần 2 (Retry 1)
  try {
    const retryRes = await saveVocabProgress(vocabId, isCorrect);
    if (retryRes.success) {
      flushPendingProgressQueue();
      return true;
    }
  } catch (err) {
    console.error('Lần 2 (Retry) ghi ngầm tiến độ SRS thất bại:', err);
  }

  // Nếu cả 2 lần đều fail ➔ Lưu tạm vào localStorage & thông báo Toast
  savePendingProgressToLocal(vocabId, isCorrect);
  if (onWarningToast) {
    onWarningToast('Mạng gián đoạn: Tiến độ SRS đã được lưu tạm trên thiết bị và sẽ tự động đồng bộ lại.');
  }
  return false;
}

// 5. Tự động Flush toàn bộ bản ghi chưa sync trong localStorage lên Server
export async function flushPendingProgressQueue(): Promise<void> {
  const queue = getPendingProgressQueue();
  if (queue.length === 0) return;

  const remaining: PendingProgressItem[] = [];

  for (const item of queue) {
    try {
      const res = await saveVocabProgress(item.vocabId, item.isCorrect);
      if (!res.success) {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  if (remaining.length === 0) {
    clearPendingProgressLocal();
  } else {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remaining));
    } catch (err) {
      console.error('Lỗi cập nhật remaining queue:', err);
    }
  }
}
