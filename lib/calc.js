// ตัวเลขทั้งหมดปรับได้ที่นี่ (ราคาฐาน = ช่วงปกติ f=ตั๋วบิน h=ที่พัก)
export const CFG = {
  daily: { budget: 800, standard: 1500, luxury: 3500 },
  ins: 350,
  range: [0.88, 1.18],
  seasons: [
    { a: '04-09', b: '04-17', f: 1.35, h: 1.1, n: 'สงกรานต์' },
    { a: '12-27', b: '01-04', f: 1.3, h: 1.2, n: 'ปีใหม่' },
    { a: '05-01', b: '05-05', f: 1.1, h: 1.25, n: 'Golden Week/วันแรงงาน' },
    { a: '10-01', b: '10-07', f: 1.1, h: 1.25, n: 'Golden Week/National Day' }
  ]
};
export const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
export const thb = (n) => '฿' + Math.round(n).toLocaleString('th-TH');
export const addDay = (s, n) => new Date(new Date(s + 'T00:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10);

export function dur(S) {
  const n = Math.max(1, Math.round((new Date(S.end) - new Date(S.start)) / 864e5));
  return { n, d: n + 1 };
}
export function season(S) {
  let f = 1, h = 1; const names = []; const { n } = dur(S);
  for (let i = 0; i <= n; i++) {
    const md = addDay(S.start, i).slice(5);
    CFG.seasons.forEach((s) => {
      const hit = s.a <= s.b ? md >= s.a && md <= s.b : md >= s.a || md <= s.b;
      if (hit) { f = Math.max(f, s.f); h = Math.max(h, s.h); if (!names.includes(s.n)) names.push(s.n); }
    });
  }
  return { f, h, names };
}
export function cost(c, S) {
  const { n, d } = dur(S), s = season(S), p = S.pax, rooms = p === 2 && S.sep ? 2 : 1;
  const o = {
    f: c.flight * s.f * p, h: c.hotel * s.h * n * rooms, g: CFG.daily[S.bud] * d * p,
    t: (c.tr || 250) * d * p, i: CFG.ins * p, v: (c.visaFee || 0) * p, s, rooms
  };
  o.tot = o.f + o.h + o.g + o.t + o.i + o.v;
  return o;
}
export const outfit = (t, r) =>
  (t <= 3 ? 'เสื้อโค้ทหนา ถุงมือ หมวก' : t < 12 ? 'แจ็คเก็ต/เลเยอร์หนา' : t < 18 ? 'สเวตเตอร์ + แจ็คเก็ตกันลม' : t < 26 ? 'เสื้อคลุมบาง รองเท้าผ้าใบ' : 'เสื้อบางระบายอากาศ ครีมกันแดด') +
  (r >= 45 ? ' · พกร่ม/เสื้อกันฝน' : '');
export const runTip = (t, r) =>
  (t >= 27 ? 'ร้อน ควรวิ่งเช้ามืด/หัวค่ำ พกน้ำ+เกลือแร่' : t <= 3 ? 'หนาวจัด วิ่งเลเยอร์ ถุงมือ หมวก ระวังพื้นลื่น' : t <= 12 ? 'อากาศเย็นกำลังดี เลเยอร์ไลต์ๆ' : 'อากาศเหมาะกับการวิ่ง') +
  (r >= 50 ? ' · พื้นเทรลอาจลื่น เลือกรองเท้าดอกลึก' : '');
export const weatherIcon = (t) => (t <= 3 ? '🥶' : t < 12 ? '🧥' : t < 18 ? '🌤️' : t < 26 ? '⛅' : '☀️');

// #แฮชแท็ก: แยกด้วยช่องว่าง/คอมมา ตัดอักขระแปลกๆ (เก็บตัวอักษรไทย/ตัวเลข/_) สูงสุด 8 อัน
export const parseTags = (s = '') =>
  [...new Set(String(s).split(/[\s,]+/).map((t) => t.replace(/^#+/, '').replace(/[^\p{L}\p{M}\p{N}_]/gu, '')).filter(Boolean).map((t) => '#' + t.slice(0, 24)))].slice(0, 8);

// แผนรายวันแนะนำอัตโนมัติจากสถานที่/จุดวิ่งของเมือง (ไม่ใช่ตารางจริง ปรับเองได้)
export function plan(c, S) {
  const { d } = dur(S);
  const runs = c.runs || [], trails = runs.filter((x) => x.t === 'trail'), cityRuns = runs.filter((x) => x.t !== 'trail'), A = c.attr || [];
  const out = [];
  for (let i = 0; i < d; i++) {
    let items;
    if (i === 0) items = ['✈️ เดินทางถึง เช็กอินย่านพัก', A[0] && '📍 ' + A[0]];
    else if (i === d - 1) items = [cityRuns[0] && '🏃 วิ่งเบาๆ ที่ ' + cityRuns[0].n + ' (ถ้าเวลาพอ)', '🧳 เช็กเอาต์ เดินทางกลับ CNX'];
    else {
      const k = i - 1, mid = d - 2;
      const trailDay = trails.length > 0 && k === Math.floor(mid / 2);
      const run = trailDay ? trails[0] : cityRuns.length ? cityRuns[k % cityRuns.length] : null;
      items = [run && (trailDay ? '⛰️ Trail: ' : '🏃 City run: ') + run.n, A.length && '📍 ' + A[(k + 1) % A.length]];
    }
    out.push({ date: addDay(S.start, i), items: items.filter(Boolean) });
  }
  return out;
}

// ลิงก์ค้นหาตั๋ว/ที่พักตามวันที่ที่เลือก (ไม่ต้องใช้ API key)
export function links(c, S, rooms) {
  const q = encodeURIComponent;
  return {
    flight: c.iata ? `https://www.google.com/travel/flights?q=${q(`Flights from CNX to ${c.iata} on ${S.start} through ${S.end}`)}` : null,
    hotel: `https://www.booking.com/searchresults.html?ss=${q(c.name)}&checkin=${S.start}&checkout=${S.end}&group_adults=${S.pax}&no_rooms=${rooms}`
  };
}
