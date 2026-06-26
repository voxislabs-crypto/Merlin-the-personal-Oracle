import { redirect } from 'next/navigation';

export default function ActiveTransitsPage() {
  redirect('/dashboard?section=transits');
}
