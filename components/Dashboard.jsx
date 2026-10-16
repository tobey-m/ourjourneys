'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Plane, User, Users, Plus, Trash2, Link2, Printer, X } from 'lucide-react';
import BASE from '../data/cities.json';
import { CFG, MONTHS, thb, addDay, dur, cost, outfit, runTip, weatherIcon, parseTags, plan, links } from '../lib/calc';
import { getBrowserSupabase } from '../lib/supabaseClient';
import ChartView from './ChartView';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="h-full min-h-[280px] bg-cream-200 rounded-xl" /> });

const DEF = { pax: 1, sep: false, bud: 'standard', start: '2027-04-10', end: '2027-04-15', active: 'taipei', sort: 'def', visa: 'all', name: '', tags: '', custom: [], checks: {} };
const KEY = 'songkranDash';

const Seg = ({ items, val, onPick, cls = '' }) => (
  <div className={'bg-cream-100 p-1 rounded-2xl flex border border-stone-200 ' + cls}>
    {items.map(([k, l]) => (
      <button key={String(k)} type="button" onClick={() => onPick(k)}
        className={'px-4 py-2 rounded-xl text-xs font-semibold transition-all ' + (k === val ? 'coral-btn shadow-sm' : 'text-stone-600 hover:text-stone-900')}>{l}</button>
    ))}
  </div>
);
const Tile = ({ label, value, sub, cls = 'bg-stone-50 border-stone-100' }) => (
  <div className={'p-3 rounded-2xl border ' + cls}>
    <div className="text-stone-400 text-xs font-semibold mb-1">{label}</div>
    <div className="text-lg font-bold">{value}</div>
    {sub && <div className="text-[10px] text-stone-400">{sub}</div>}
  </div>
);
const inp = 'p-3 rounded-xl border border-stone-200 bg-stone-50 text-sm';

export default function Dashboard({ initial, shared }) {
  const [S, setS] = useState({ ...DEF, ...initial });
  const [ready, setReady] = useState(false);
  const [fx, setFx] = useState(null);
  const [wx, setWx] = useState(null);
  const [modal, setModal] = useState(false);
  const [focus, setFocus] = useState(null);
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [mine, setMine] = useState(null);
  const [email, setEmail] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const sb = useMemo(() => getBrowserSupabase(), []);
  const up = (p) => setS((s) => ({ ...s, ...p }));

  // โหลด/บันทึก localStorage (หน้าแชร์ไม่เขียนทับของเรา)
  useEffect(() => {
    if (!shared) { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v) setS((s) => ({ ...s, ...v })); } catch {} }
    setReady(true);
  }, [shared]);
  useEffect(() => { if (ready && !shared) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} } }, [S, ready, shared]);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setUser(data.session ? data.session.user : null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, ses) => setUser(ses ? ses.user : null));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => { fetch('/api/fx').then((r) => (r.ok ? r.json() : null)).then(setFx).catch(() => {}); }, []);

  const cities = useMemo(() => [...BASE, ...S.custom], [S.custom]);
  const c = cities.find((x) => x.id === S.active) || cities[0];

  useEffect(() => {
    setWx(null);
    const ac = new AbortController();
    fetch(`/api/weather?lat=${c.lat}&lng=${c.lng}&start=${S.start}&end=${S.end}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null)).then(setWx).catch(() => {});
    return () => ac.abort();
  }, [c.lat, c.lng, S.start, S.end]);

  const { n, d } = dur(S);
  const o = cost(c, S);
  const list = cities.map((x) => ({ x, t: cost(x, S).tot }));
  const min = Math.min(...list.map((i) => i.t));
  const shown = list.filter((i) => S.visa === 'all' || i.x.visa === 'Free Visa' || i.x.id === c.id);
  const sorted = S.sort === 'asc' ? [...shown].sort((a, b) => a.t - b.t) : shown;
  const tags = parseTags(S.tags);
  const lk = links(c, S, o.rooms);

  const m = new Date(S.start).getMonth();
  const w = wx && wx.t != null
    ? { t: Math.round(wx.t), r: Math.round(wx.rain), src: wx.mode === 'forecast' ? 'พยากรณ์ล่วงหน้า (Open-Meteo)' : 'เฉลี่ยย้อนหลัง 3 ปี วันเดียวกัน (Open-Meteo)' }
    : c.clim ? { t: c.clim.t[m], r: c.clim.r[m], src: 'ค่าเฉลี่ยรายเดือนโดยประมาณ' } : null;

  const liveRate = c.cur && fx && fx[c.cur[0]];
  const rate = liveRate || (c.cur && c.cur[1]);

  const items = [
    'พาสปอร์ต (อายุ > 6 เดือน)', 'ซิม/eSIM', 'Travel Card (YouTrip ฯลฯ)', 'Universal Adapter / Powerbank', 'ยาสามัญประจำตัว', 'ประกันเดินทาง', 'รองเท้าวิ่ง + นาฬิกา GPS',
    ...(c.runs && c.runs.some((x) => x.t === 'trail') ? ['รองเท้า Trail/ถุงเท้าสำรอง', 'เสื้อกันลมพับเก็บได้ + เวสต์น้ำ'] : []),
    ...(c.chk || []), ...(S.pax === 2 ? ['ยืนยันชื่อผู้เข้าพักทั้ง 2 คน'] : [])
  ];
  const ck = (x) => c.id + '|' + x;
  const done = items.filter((x) => S.checks[ck(x)]).length;

  function setStart(v) { if (!v) return; up({ start: v, end: S.end <= v ? addDay(v, 1) : S.end }); }
  function setEnd(v) { if (!v) return; up({ end: v <= S.start ? addDay(S.start, 1) : v }); }
  function addCity(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const city = { id: 'c_' + Date.now(), custom: true, name: f.name.trim(), flag: f.flag.trim(), visa: f.visa, visaFee: 0, flight: +f.flight, hotel: +f.hotel, tr: 250,
      attr: ['แลนด์มาร์กสำคัญ', 'ย่านของกินท้องถิ่น', 'จุดถ่ายรูปฮิต'], clim: null, runs: [], stay: 'ย่านกลางเมือง', lat: +f.lat, lng: +f.lng };
    up({ custom: [...S.custom, city], active: city.id }); setModal(false);
  }
  function delCity() { if (c.custom && confirm('ลบ ' + c.name + ' ?')) up({ custom: S.custom.filter((x) => x.id !== c.id), active: 'taipei' }); }
  const authed = async () => { const { data } = await sb.auth.getSession(); return data.session ? { Authorization: 'Bearer ' + data.session.access_token } : {}; };
  async function save() {
    setMsg('กำลังบันทึก…');
    try {
      const { checks, ...state } = S;
      const r = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(sb ? await authed() : {}) }, body: JSON.stringify({ state, id: user ? tripId || undefined : undefined }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'error');
      setTripId(j.id);
      const url = location.origin + '/t/' + j.id;
      await navigator.clipboard.writeText(url).catch(() => {});
      setMsg((user && tripId ? 'บันทึกทับแล้ว · ' : 'บันทึกแล้ว · ') + 'คัดลอกลิงก์: ' + url);
    } catch (e) { setMsg('บันทึกไม่สำเร็จ: ' + e.message); }
  }
  async function loadMine() {
    try { const r = await fetch('/api/trips', { headers: await authed() }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setMine(j.trips); }
    catch (e) { setMsg('โหลดไม่สำเร็จ: ' + e.message); }
  }
  async function openTrip(id) {
    const r = await fetch('/api/trips?id=' + id, { headers: await authed() }); const j = await r.json();
    if (r.ok) { setS((s) => ({ ...DEF, ...j.state, checks: s.checks })); setTripId(id); setMine(null); } else setMsg(j.error || 'เปิดไม่สำเร็จ');
  }
  async function delTrip(id) {
    if (!confirm('ลบทริปนี้?')) return;
    await fetch('/api/trips?id=' + id, { method: 'DELETE', headers: await authed() });
    if (id === tripId) setTripId(null);
    loadMine();
  }
  async function login(e) {
    e.preventDefault();
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin } });
    setMsg(error ? 'ส่งลิงก์ไม่สำเร็จ: ' + error.message : 'ส่งลิงก์เข้าสู่ระบบไปที่อีเมลแล้ว');
    if (!error) setAuthOpen(false);
  }
  const logout = async () => { await sb.auth.signOut(); setTripId(null); setMine(null); };
  function print() { const old = document.title; document.title = S.name || `Travel_Plan_${c.name}_${d}D${n}N`; window.print(); document.title = old; }

  const visaCls = c.visa === 'Free Visa' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : c.visa === 'K-ETA' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-rose-100 text-rose-700 border-rose-200';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="hidden print:block bento-card p-4 font-bold">{S.name ? S.name + ' — ' : ''}{c.name} · {S.start} ถึง {S.end} ({d} วัน {n} คืน) · {S.pax} คน{tags.length ? '  ' + tags.join(' ') : ''}</div>

      <header className="no-print flex flex-col xl:flex-row xl:flex-wrap items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 md:p-5 rounded-[2rem] border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="w-12 h-12 rounded-full bg-coral-500 text-white flex items-center justify-center shadow-lg shrink-0"><Plane size={22} /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-stone-900 leading-tight">Travel Dashboard</h1>
            <p className="text-sm text-stone-500">เปรียบเทียบงบหนีร้อน + จุดวิ่ง Trail/City (CNX Departure)</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center xl:justify-end gap-3 w-full xl:w-auto">
          <div className="bg-cream-100 rounded-2xl flex items-center border border-stone-200 text-sm gap-2 px-3 py-1.5">
            <input type="date" aria-label="วันไป" value={S.start} onChange={(e) => setStart(e.target.value)} className="bg-transparent outline-none font-medium" />
            <span className="text-stone-400">-</span>
            <input type="date" aria-label="วันกลับ" value={S.end} min={addDay(S.start, 1)} onChange={(e) => setEnd(e.target.value)} className="bg-transparent outline-none font-medium" />
          </div>
          <Seg items={[[1, <span key="1" className="flex items-center gap-1"><User size={13} />1 คน</span>], [2, <span key="2" className="flex items-center gap-1"><Users size={13} />2 คน</span>]]} val={S.pax} onPick={(v) => up({ pax: v })} />
          {S.pax === 2 && <Seg items={[[false, 'แชร์ห้อง'], [true, 'แยกห้อง']]} val={S.sep} onPick={(v) => up({ sep: v })} />}
          <Seg items={[['budget', 'ประหยัด'], ['standard', 'มาตรฐาน'], ['luxury', 'หรูหรา']]} val={S.bud} onPick={(v) => up({ bud: v })} />
          <button onClick={() => setModal(true)} aria-label="เพิ่มเมือง" title="เพิ่มเมือง" className="w-10 h-10 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 shadow-md flex items-center justify-center"><Plus size={18} /></button>
          <button onClick={print} title="เลือก Save as PDF ในหน้าต่างพิมพ์" className="px-4 py-2 rounded-2xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-semibold shadow-sm flex items-center gap-2"><Printer size={15} className="text-coral-500" />PDF</button>
          {!shared && <button onClick={save} className="px-4 py-2 rounded-2xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-semibold shadow-sm flex items-center gap-2"><Link2 size={15} className="text-coral-500" />{user ? (tripId ? 'บันทึกทับ' : 'บันทึก') : 'แชร์'}</button>}
        </div>
        <div className="w-full flex flex-col md:flex-row gap-3 items-stretch md:items-center border-t border-stone-100 pt-3">
          <input aria-label="ชื่อทริป" maxLength={80} value={S.name} onChange={(e) => up({ name: e.target.value })} placeholder="ชื่อทริป เช่น หนีร้อน Songkran 2027" className={inp + ' flex-1'} />
          <input aria-label="แฮชแท็ก" maxLength={120} value={S.tags} onChange={(e) => up({ tags: e.target.value })} placeholder="#หนีร้อน #trail #สงกรานต์" className={inp + ' flex-1'} />
          {!shared && (user ? (
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <span className="truncate max-w-[160px]">{user.email}</span>
              <button onClick={loadMine} className="underline">ทริปของฉัน</button>
              <button onClick={logout} className="underline">ออก</button>
            </div>
          ) : sb && <button onClick={() => setAuthOpen((v) => !v)} className="text-xs underline text-stone-600">เข้าสู่ระบบ</button>)}
        </div>
        {tags.length > 0 && <div className="w-full flex flex-wrap gap-2">{tags.map((t) => <span key={t} className="text-xs bg-coral-50 text-coral-600 border border-coral-100 px-2 py-0.5 rounded-full">{t}</span>)}</div>}
        {authOpen && !user && (
          <form onSubmit={login} className="w-full flex gap-2">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมล (ระบบส่งลิงก์เข้าสู่ระบบให้)" className={inp + ' flex-1'} />
            <button className="coral-btn px-4 py-2 rounded-xl text-sm font-semibold">ส่งลิงก์</button>
          </form>
        )}
        {mine && (
          <div className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 space-y-1">
            {mine.length === 0 && <p className="text-xs text-stone-400">ยังไม่มีทริปที่บันทึกไว้</p>}
            {mine.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate">{t.name || 'ไม่มีชื่อ'} <span className="text-xs text-stone-400">{t.tags}</span></span>
                <button onClick={() => openTrip(t.id)} className="text-xs underline">เปิด</button>
                <button onClick={() => delTrip(t.id)} className="text-xs underline text-coral-600">ลบ</button>
              </div>
            ))}
          </div>
        )}
        {msg && <p className="text-xs text-stone-500 w-full text-center break-all">{msg}</p>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 bento-card p-5 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">📍 เลือกจุดหมายปลายทาง</h2>
            <div className="flex items-center gap-2 no-print">
              <select aria-label="เรียงลำดับ" value={S.sort} onChange={(e) => up({ sort: e.target.value })} className="text-xs bg-cream-100 border border-stone-200 rounded-lg px-2 py-1">
                <option value="def">เรียงตามเดิม</option><option value="asc">ถูก → แพง</option>
              </select>
              <select aria-label="กรองวีซ่า" value={S.visa} onChange={(e) => up({ visa: e.target.value })} className="text-xs bg-cream-100 border border-stone-200 rounded-lg px-2 py-1">
                <option value="all">ทุกวีซ่า</option><option value="free">Free Visa เท่านั้น</option>
              </select>
              <span className="text-xs bg-cream-200 text-stone-600 px-2 py-1 rounded-lg font-medium">{d} วัน {n} คืน</span>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 snap-x hide-scrollbar">
            {sorted.map(({ x, t }) => {
              const on = x.id === c.id;
              return (
                <button key={x.id} type="button" onClick={() => up({ active: x.id })}
                  className={'flex-shrink-0 text-left snap-start px-5 py-3 rounded-2xl border-2 transition-all min-w-[150px] ' + (on ? 'bg-coral-50 border-coral-500 shadow-md' : 'bg-white border-stone-100 hover:border-coral-400')}>
                  <div className="text-2xl mb-1">{x.flag}</div>
                  <div className={'text-sm font-bold ' + (on ? 'text-coral-600' : 'text-stone-700')}>{x.name}</div>
                  <div className="text-[11px] text-stone-600 mt-1">{thb(t)}</div>
                  <div className={'text-[10px] ' + (t === min ? 'text-emerald-600 font-semibold' : 'text-stone-400')}>{t === min ? 'ถูกสุด' : '+' + thb(t - min)}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 bento-card p-6 md:p-8 flex flex-col justify-between">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900">{c.name}</h2>
            <span className="text-2xl">{c.flag}</span>
            <span className={'ml-2 px-3 py-1 text-xs font-bold rounded-full border ' + visaCls}>{c.visa}</span>
            {c.vurl && <a href={c.vurl} target="_blank" rel="noopener noreferrer" className="text-xs text-coral-600 underline">เช็กกฎวีซ่าทางการ</a>}
            {c.custom && <button onClick={delCity} className="no-print ml-auto text-xs text-stone-500 hover:text-coral-600 flex items-center gap-1"><Trash2 size={13} />ลบ</button>}
          </div>
          <div className="text-xs text-stone-500 mb-4">✈️ {c.ft || 'ตรวจสอบเวลาบินจาก CNX'} · {o.s.names.length ? `ช่วง${o.s.names.join('/')}: ตั๋วบิน ×${o.s.f}, ที่พัก ×${o.s.h}` : 'ช่วงราคาปกติ'}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Tile label={`🎫 ตั๋วบิน (${S.pax} คน)`} value={thb(o.f)} />
            <Tile label={`🛏️ ที่พัก (${n} คืน)`} value={thb(o.h)} sub={o.rooms === 2 ? '2 ห้อง (แยกห้อง)' : S.pax === 2 ? '1 ห้อง (แชร์ 2 คน)' : '1 ห้อง'} />
            <Tile label={`🍜 กินเที่ยว (${d} วัน)`} value={thb(o.g)} />
            <div className="bg-coral-50 p-3 rounded-2xl border border-coral-100 flex flex-col justify-center">
              <div className="text-coral-600 text-[10px] font-bold uppercase tracking-wider">งบรวมสุทธิ</div>
              <div className="text-xl md:text-2xl font-black text-coral-600">{thb(o.tot)}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2 text-xs">
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">🚇 เดินทางในเมือง<b className="block text-sm">{thb(o.t)}</b></div>
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">🛡️ ประกัน + วีซ่า<b className="block text-sm">{thb(o.i + o.v)}</b></div>
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">↔️ ช่วงงบที่เป็นไปได้<b className="block text-sm">{thb(o.tot * CFG.range[0])} – {thb(o.tot * CFG.range[1])}</b></div>
          </div>
          <p className="text-[11px] text-stone-400 mb-5">
            {c.cur && c.cur[0] !== 'THB' && rate ? `≈ ${Math.round(o.tot * rate).toLocaleString('en')} ${c.cur[0]} (${liveRate ? 'อัตราล่าสุด' : 'อัตราโดยประมาณ'} 1 THB ≈ ${Number(rate).toFixed(2)} ${c.cur[0]}). ` : ''}
            ราคาตั๋ว/ที่พักเป็นค่าประมาณการ ไม่ใช่ราคาจริง ตรวจสอบก่อนจอง
          </p>
          <div className="no-print flex flex-wrap gap-2 mb-5 text-xs">
            {lk.flight && <a href={lk.flight} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-coral-400">🔎 ค้นหาตั๋ว CNX → {c.iata}</a>}
            <a href={lk.hotel} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-coral-400">🔎 ค้นหาที่พัก {c.name}</a>
          </div>
          <h3 className="text-sm font-bold text-stone-800 mb-3">🔥 Trendy &amp; Cool Attractions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {c.attr.map((a, i) => (
              <div key={i} className="bg-white border border-stone-100 rounded-xl p-3 flex items-start gap-2 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-coral-100 text-coral-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                <div className="text-xs font-medium text-stone-700 pt-0.5">{a}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bento-card p-5 flex flex-col">
          <h3 className="text-sm font-bold text-stone-800 mb-4">📊 เปรียบเทียบงบรวมแต่ละเมือง (THB)</h3>
          <div className="flex-1 relative min-h-[260px]">
            <ChartView labels={cities.map((x) => x.name)} data={list.map((i) => i.t)} activeIdx={cities.findIndex((x) => x.id === c.id)} />
          </div>
        </div>

        <div className="lg:col-span-5 bento-card p-4 h-[420px] flex flex-col">
          <h3 className="text-sm font-bold text-stone-800 mb-2">🗺️ ย่านพัก &amp; จุดวิ่ง</h3>
          <div className="flex gap-3 text-[11px] text-stone-500 mb-2"><span>🔴 ย่านพัก</span><span>🔵 City run</span><span>🟢 Trail</span></div>
          <div className="flex-1 min-h-[280px] rounded-xl overflow-hidden border border-stone-200"><MapView city={c} focus={focus} /></div>
        </div>

        <div className="lg:col-span-7 bento-card p-5">
          <h3 className="text-sm font-bold text-stone-800 mb-1">🏃 Trail + City Run</h3>
          <p className="text-xs text-stone-500 mb-3">🛏️ ย่านที่แนะนำให้พัก: <b>{c.stay || 'ย่านกลางเมือง'}</b></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(c.runs || []).length ? c.runs.map((x, i) => (
              <div key={i} className="bg-stone-50 border border-stone-100 rounded-xl p-3 hover:border-coral-400 transition-all">
                <button type="button" onClick={() => setFocus({ i, t: Date.now() })} className="text-left w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + (x.t === 'trail' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700')}>{x.t === 'trail' ? 'TRAIL' : 'CITY RUN'}</span>
                    <b className="text-sm text-stone-800">{x.n}</b>
                  </div>
                  <div className="text-xs text-stone-500">{x.d}</div>
                </button>
                <a href={`https://www.google.com/maps/search/?api=1&query=${x.lat},${x.lng}`} target="_blank" rel="noopener noreferrer" className="no-print text-[11px] text-coral-600 underline mt-1 inline-block">เปิดใน Google Maps</a>
              </div>
            )) : <p className="text-xs text-stone-400 sm:col-span-2">เมืองที่เพิ่มเองยังไม่มีข้อมูลจุดวิ่ง</p>}
          </div>
          <p className="text-[11px] text-stone-400 mt-3">ระยะทาง/เวลาเป็นค่าประมาณ พิกัดโดยประมาณ ตรวจสอบเส้นทางและความปลอดภัยใน Google Maps/Strava ก่อนออกวิ่ง</p>
        </div>

        <div className="lg:col-span-12 bento-card p-5">
          <h3 className="text-sm font-bold text-stone-800 mb-1">🗓️ แผนรายวัน (แนะนำอัตโนมัติ)</h3>
          <p className="text-[11px] text-stone-400 mb-3">จัดจากสถานที่และจุดวิ่งของเมืองนี้ ไม่ใช่ตารางจริง ปรับตามเวลาบินและสภาพอากาศ</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plan(c, S).map((p, i) => (
              <div key={p.date} className="bg-stone-50 border border-stone-100 rounded-xl p-3">
                <div className="text-xs font-bold text-coral-600 mb-1">Day {i + 1} · {p.date}</div>
                <ul className="text-xs text-stone-600 space-y-1">{p.items.map((t, j) => <li key={j}>{t}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bento-card p-5 bg-gradient-to-br from-white to-cream-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-800">☁️ สภาพอากาศ ({MONTHS[m]})</h3>
            {w ? (
              <div className="flex items-center justify-between my-3">
                <div><div className="text-4xl font-black">{w.t}°C</div><div className="text-xs text-stone-500 mt-1">☂️ โอกาสฝน: {w.r}%</div></div>
                <div className="w-16 h-16 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-4xl">{weatherIcon(w.t)}</div>
              </div>
            ) : <p className="text-sm text-stone-500 my-3">ไม่มีข้อมูลสภาพอากาศ ตรวจสอบพยากรณ์ก่อนเดินทาง</p>}
          </div>
          {w && (
            <div className="space-y-2">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-sm text-stone-600"><b className="text-xs text-stone-700">💡 แต่งตัว:</b> {outfit(w.t, w.r)}</div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-sm text-stone-600"><b className="text-xs text-emerald-700">🏃 วิ่ง:</b> {runTip(w.t, w.r)}</div>
              <p className="text-[11px] text-stone-400">แหล่งข้อมูล: {w.src}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bento-card p-5 no-print flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-800">🧳 Packing Checklist</h3>
            <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-md">{done}/{items.length}</span>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-64 pr-2 hide-scrollbar">
            {items.map((x) => (
              <label key={x} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-stone-50">
                <input type="checkbox" className="w-5 h-5 accent-[#E05A47]" checked={!!S.checks[ck(x)]} onChange={() => up({ checks: { ...S.checks, [ck(x)]: !S.checks[ck(x)] } })} />
                <span className={'text-sm ' + (S.checks[ck(x)] ? 'text-stone-400 line-through' : 'text-stone-700')}>{x}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div className="no-print fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setModal(false)} aria-label="ปิด" className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center"><X size={16} /></button>
            <h2 className="text-xl font-bold mb-4">เพิ่มเมืองใหม่</h2>
            <form onSubmit={addCity} className="space-y-3">
              <div className="grid grid-cols-2 gap-3"><input name="name" required placeholder="ชื่อเมือง เช่น Osaka" className={inp} /><input name="flag" required placeholder="ธง 🇯🇵" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3"><input name="flight" type="number" min="0" required placeholder="ตั๋วบิน/คน (บาท)" className={inp} /><input name="hotel" type="number" min="0" required placeholder="โรงแรม/คืน (บาท)" className={inp} /></div>
              <select name="visa" className={inp + ' w-full'}><option>Free Visa</option><option>K-ETA</option><option>Need Visa</option></select>
              <div className="grid grid-cols-2 gap-3"><input name="lat" type="number" step="any" required placeholder="Latitude" className={inp} /><input name="lng" type="number" step="any" required placeholder="Longitude" className={inp} /></div>
              <button className="w-full py-3 rounded-xl coral-btn font-bold">+ เพิ่มเมือง</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
