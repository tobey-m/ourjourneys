import { createClient } from '@supabase/supabase-js';

// ฝั่งเบราว์เซอร์: ใช้ anon key เพื่อเข้าสู่ระบบ (Auth) เท่านั้น ตาราง trips เข้าตรงไม่ได้ (RLS ปิดทั้งหมด)
let client;
export function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return client || (client = createClient(url, key));
}
