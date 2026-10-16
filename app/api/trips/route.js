import { createHash } from 'crypto';
import { getDb } from '../../../lib/supabase';

const PICK = ['name', 'tags', 'pax', 'sep', 'bud', 'start', 'end', 'active', 'sort', 'visa', 'custom'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const err = (m, s) => Response.json({ error: m }, { status: s });

async function userOf(db, req) {
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!t) return null;
  const { data } = await db.auth.getUser(t);
  return data && data.user ? data.user : null;
}

// POST: สร้างทริปใหม่ (ใครก็ได้ มี rate limit) หรืออัปเดตทริปของตัวเอง (ต้องล็อกอิน + ส่ง id)
export async function POST(req) {
  const db = getDb();
  if (!db) return err('Supabase ยังไม่ได้ตั้งค่า (ดู README)', 503);
  let body; try { body = await req.json(); } catch { return err('bad json', 400); }
  const s = body && body.state;
  if (!s || typeof s !== 'object') return err('missing state', 400);

  const state = {};
  for (const k of PICK) if (k in s) state[k] = s[k];
  state.custom = Array.isArray(state.custom) ? state.custom.slice(0, 20) : [];
  state.name = String(state.name || '').slice(0, 80);
  state.tags = String(state.tags || '').slice(0, 120);
  if (JSON.stringify(state).length > 40000) return err('too large', 413);
  const row = { state, name: state.name, tags: state.tags };

  const user = await userOf(db, req);
  if (body.id) {
    if (!user) return err('ต้องเข้าสู่ระบบ', 401);
    if (!UUID.test(body.id)) return err('bad id', 400);
    const { data } = await db.from('trips').update({ ...row, updated_at: new Date().toISOString() }).eq('id', body.id).eq('user_id', user.id).select('id').maybeSingle();
    return data ? Response.json({ id: data.id }) : err('ไม่พบทริปนี้ในบัญชีของคุณ', 404);
  }

  // rate limit: ผู้ใช้ทั่วไป 10 ลิงก์/ชม./IP, ผู้ใช้ล็อกอิน 50 ทริป/บัญชี
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const ipHash = createHash('sha256').update(ip + (process.env.SUPABASE_SERVICE_ROLE_KEY || '')).digest('hex').slice(0, 32);
  let q = db.from('trips').select('id', { count: 'exact', head: true });
  q = user ? q.eq('user_id', user.id) : q.eq('ip_hash', ipHash).gte('created_at', new Date(Date.now() - 36e5).toISOString());
  const { count } = await q;
  if ((count || 0) >= (user ? 50 : 10)) return err('สร้างลิงก์บ่อยเกินไป ลองใหม่ภายหลัง', 429);

  const { data, error } = await db.from('trips').insert({ ...row, user_id: user ? user.id : null, ip_hash: ipHash }).select('id').single();
  return error ? err('บันทึกไม่สำเร็จ', 500) : Response.json({ id: data.id });
}

// GET: รายการทริปของฉัน, หรือ ?id= เพื่อเปิดทริปของตัวเองไปแก้ไข
export async function GET(req) {
  const db = getDb();
  if (!db) return err('Supabase ยังไม่ได้ตั้งค่า', 503);
  const user = await userOf(db, req);
  if (!user) return err('ต้องเข้าสู่ระบบ', 401);
  const id = new URL(req.url).searchParams.get('id');
  if (id) {
    if (!UUID.test(id)) return err('bad id', 400);
    const { data } = await db.from('trips').select('state').eq('id', id).eq('user_id', user.id).maybeSingle();
    return data ? Response.json({ state: data.state }) : err('ไม่พบทริป', 404);
  }
  const { data } = await db.from('trips').select('id,name,tags,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(50);
  return Response.json({ trips: data || [] });
}

export async function DELETE(req) {
  const db = getDb();
  if (!db) return err('Supabase ยังไม่ได้ตั้งค่า', 503);
  const user = await userOf(db, req);
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!user) return err('ต้องเข้าสู่ระบบ', 401);
  if (!UUID.test(id)) return err('bad id', 400);
  await db.from('trips').delete().eq('id', id).eq('user_id', user.id);
  return Response.json({ ok: true });
}
