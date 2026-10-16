// อัตราแลกเปลี่ยนจริง (THB -> สกุลท้องถิ่น) จาก open.er-api.com ไม่ต้องใช้ key แคช 6 ชม.
export const revalidate = 21600;

export async function GET() {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/THB', { next: { revalidate: 21600 } });
    if (!r.ok) throw new Error('upstream ' + r.status);
    const j = await r.json();
    const { TWD, JPY, KRW, CNY } = j.rates || {};
    return Response.json({ TWD, JPY, KRW, CNY, updated: j.time_last_update_utc });
  } catch (e) {
    return Response.json({ error: 'fx unavailable' }, { status: 502 });
  }
}
