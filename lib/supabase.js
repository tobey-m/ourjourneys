import { createClient } from '@supabase/supabase-js';

// สร้าง client ฝั่ง server เท่านั้น (ใช้ service role key) คืน null ถ้ายังไม่ตั้ง env
export function getDb() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
