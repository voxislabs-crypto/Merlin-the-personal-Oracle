import { redirect } from 'next/navigation';

export default function ChartReadingPage() {
  redirect('/dashboard?section=interpretation');
}
