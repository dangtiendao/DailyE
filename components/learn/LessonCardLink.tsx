'use client';

import React from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { lessonDetailQueryOptions } from '@/lib/query-options';

interface LessonCardLinkProps {
  slug: string;
  className?: string;
  children: React.ReactNode;
}

export function LessonCardLink({ slug, className, children }: LessonCardLinkProps) {
  const queryClient = useQueryClient();

  const handlePrefetch = () => {
    queryClient.prefetchQuery(lessonDetailQueryOptions(slug));
  };

  return (
    <Link
      href={`/learn/${slug}`}
      prefetch={true}
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      className={className}
    >
      {children}
    </Link>
  );
}
