import { redirect } from 'next/navigation';

export default function DualMbtiPage() {
  redirect('/dashboard?section=personality');
}
