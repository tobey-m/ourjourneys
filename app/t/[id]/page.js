import { notFound } from 'next/navigation';
import Dashboard from '../../../components/Dashboard';
import { getDb } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SharedTrip({ params }) {
  if (!UUID.test(params.id)) notFound();
  const db = getDb();
  if (!db) notFound();
  const { data } = await db.from('trips').select('state').eq('id', params.id).maybeSingle();
  if (!data) notFound();
  return <Dashboard initial={data.state} shared />;
}
