// อากาศจาก Open-Meteo (ฟรี ไม่ต้องใช้ key)
// - ทริปอยู่ใน 16 วันข้างหน้า -> พยากรณ์จริง
// - ไกลกว่านั้น -> เฉลี่ยย้อนหลัง 3 ปี ของวันที่เดียวกัน (เพราะยังไม่มีพยากรณ์)
export const revalidate = 21600;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAILY = 'temperature_2m_max,temperature_2m_min,precipitation_sum';
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;

function summarize(runs) {
  const tmax = [], tmin = [], rain = [];
  for (const d of runs) {
    d.temperature_2m_max.forEach((v, i) => {
      const lo = d.temperature_2m_min[i], p = d.precipitation_sum[i];
      if (v == null || lo == null) return;
      tmax.push(v); tmin.push(lo); rain.push(p != null && p >= 1 ? 100 : 0);
    });
  }
  if (!tmax.length) return null;
  return { tmax: avg(tmax), tmin: avg(tmin), t: (avg(tmax) + avg(tmin)) / 2, rain: avg(rain) };
}

async function get(url) {
  const r = await fetch(url, { next: { revalidate: 21600 } });
  if (!r.ok) return null;
  return (await r.json()).daily || null;
}

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get('lat')), lng = Number(q.get('lng')), start = q.get('start') || '', end = q.get('end') || '';
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !DATE.test(start) || !DATE.test(end) || end < start) {
    return Response.json({ error: 'bad params' }, { status: 400 });
  }
  const base = `latitude=${lat}&longitude=${lng}&daily=${DAILY}&timezone=auto`;
  const today = new Date().toISOString().slice(0, 10);
  const limit = new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10);

  try {
    if (start >= today && end <= limit) {
      const d = await get(`https://api.open-meteo.com/v1/forecast?${base}&start_date=${start}&end_date=${end}`);
      const s = d && summarize([d]);
      if (s) return Response.json({ mode: 'forecast', ...s });
    }
    // เฉลี่ยย้อนหลัง 3 ปีล่าสุดที่จบแล้ว
    const last = new Date().getFullYear() - 1;
    const runs = await Promise.all([0, 1, 2].map((k) => {
      const y = last - k, s = y + start.slice(4), e = y + end.slice(4);
      if (isNaN(new Date(s)) || isNaN(new Date(e))) return null;
      return get(`https://archive-api.open-meteo.com/v1/archive?${base}&start_date=${s}&end_date=${e}`).catch(() => null);
    }));
    const s = summarize(runs.filter(Boolean));
    if (!s) return Response.json({ error: 'no data' }, { status: 502 });
    return Response.json({ mode: 'history', ...s });
  } catch (e) {
    return Response.json({ error: 'weather unavailable' }, { status: 502 });
  }
}
