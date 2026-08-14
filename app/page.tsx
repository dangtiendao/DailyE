import { redirect } from 'next/navigation';

// Fallback Server Component cho route "/" (nếu middleware chưa intercept)
export default function RootPage() {
  redirect('/today');
}
