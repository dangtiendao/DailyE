import { queryOptions } from '@tanstack/react-query';
import { getTodayDashboardData } from '@/app/actions/srs';
import { getPublishedLessonsWithProgress, getLessonBySlug } from '@/app/actions/learn';
import { getUserProgressStats } from '@/app/actions/progress';
import { getActiveTopics, getActiveLevels } from '@/lib/taxonomy';

// Query Options chuẩn hóa dùng chung cho React Query caching & prefetching

// 1. Quản lý query cho /today
export const todayQueryOptions = () =>
  queryOptions({
    queryKey: ['todayDashboard'],
    queryFn: () => getTodayDashboardData(),
    staleTime: 60 * 1000,
  });

// 2. Quản lý query cho danh sách bài học /learn
export const learnQueryOptions = (topic: string = 'all') =>
  queryOptions({
    queryKey: ['publishedLessons', topic],
    queryFn: () => getPublishedLessonsWithProgress(topic),
    staleTime: 60 * 1000,
  });

// 3. Quản lý query chi tiết bài học /learn/[slug]
export const lessonDetailQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ['lessonDetail', slug],
    queryFn: () => getLessonBySlug(slug),
    staleTime: 60 * 1000,
  });

// 4. Quản lý query cho báo cáo tiến độ /progress
export const progressQueryOptions = () =>
  queryOptions({
    queryKey: ['userProgressStats'],
    queryFn: () => getUserProgressStats(),
    staleTime: 60 * 1000,
  });

// 5. Quản lý query cho dữ liệu taxonomy /practice
export const taxonomyQueryOptions = () =>
  queryOptions({
    queryKey: ['activeTaxonomy'],
    queryFn: async () => {
      const [topics, levels] = await Promise.all([getActiveTopics(), getActiveLevels()]);
      return { topics, levels };
    },
    staleTime: 5 * 60 * 1000,
  });
