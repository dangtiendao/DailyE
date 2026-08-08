'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/app/actions/auth';

// React Query Custom Hook lấy và cache thông tin Profile người dùng
export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const profile = await getUserProfile();
      return profile;
    },
    staleTime: 5 * 60 * 1000, // Cache dữ liệu trong 5 phút
    refetchOnWindowFocus: false,
  });
}
