import { redirect } from 'next/navigation';

export default function StormRadarPage() {
  redirect('/dashboard?section=stormradar');
}

