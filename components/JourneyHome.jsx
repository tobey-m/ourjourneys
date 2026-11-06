'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const KEY = 'ourjourneys_v2_draft';
const initial = { trips: [], active: null };
export default function JourneyHome() {
  const [data, setData] = useState(initial);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [place, setPlace] = useState('');
  const [tab, setTab] = useState('bucket');
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && Array.isArray(saved.trips)) setData(saved); } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(data)); }, [data, ready]);
  const active = data.trips.find(t => t.id === data.active);
  const createTrip = (e) => {
    e.preventDefault();
    if (!name.trim() || !destination.trim()) return;
    const id = String(Date.now());
    setData(d => ({ active: id, trips: [...d.trips, { id, name: name.trim(), destination: destination.trim(), places: [] }] }));
    setName(''); setDestination(''); setTab('bucket');
  };
  const update = (fn) => setData(d => ({ ...d, trips: d.trips.map(t => t.id === d.active ? fn(t) : t) }));
  const addPlace = (e) => {
    e.preventDefault();
    if (!place.trim()) return;
    update(t => ({ ...t, places: [...t.places, { id: String(Date.now()), name: place.trim(), priority: 'Maybe', day: null, visited: false }] }));
    setPlace('');
  };
  const setPlaceField = (id, fields) => update(t => ({ ...t, places: t.places.map(p => p.id === id ? { ...p, ...fields } : p) }));
  const card = { background: '#fff', border: '1px solid #e8ebf0', borderRadius: 22, padding: 20, boxShadow: '0 4px 20px #1d2a4408' };
  const button = { background: '#2449c7', color: '#fff', border: 0, borderRadius: 12, padding: '12px 16px', fontWeight: 650, cursor: 'pointer' };
  return <main style={{ background: '#f8f9fb', color: '#1d2a44', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    <div style={{ maxWidth: 850, margin: 'auto', padding: '24px 16px 100px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <strong style={{ fontSize: 22, letterSpacing: '-1px' }}>ourjourneys<span style={{ color: '#e66e59' }}>.</span></strong>
        <Link href="/classic" style={{ color: '#2449c7', fontSize: 13 }}>Classic dashboard ↗</Link>
      </header>
      <section style={{ borderRadius: 24, padding: '48px 24px', marginBottom: 24, background: 'linear-gradient(120deg,#dfe8f9,#fff3e5)', textAlign: 'center' }}>
        <div style={{ color: '#e66e59', fontWeight: 750, fontSize: 12, letterSpacing: 2 }}>THE JOURNEY STARTS HERE</div>
        <h1 style={{ fontSize: 'clamp(32px,7vw,56px)', letterSpacing: '-2px', lineHeight: 1.12, margin: '14px 0' }}>Plan a little.<br/>Wander a lot.</h1>
        <p style={{ color: '#687487' }}>Save the places you love. Make plans you can change.</p>
      </section>
      <section style={{ ...card, marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, marginTop: 0 }}>My trips</h2>
        {data.trips.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>{data.trips.map(t => <button key={t.id} onClick={() => { setData(d => ({ ...d, active: t.id })); setTab('bucket'); }} style={{ ...button, background: data.active === t.id ? '#2449c7' : '#eef1f8', color: data.active === t.id ? '#fff' : '#2449c7' }}>{t.name}</button>)}</div>}
        <form onSubmit={createTrip} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          <input aria-label="Trip name" placeholder="Trip name, e.g. Taipei Escape" value={name} onChange={e => setName(e.target.value)} required maxLength={80} style={{ padding: 12, border: '1px solid #dce0e7', borderRadius: 12 }}/>
          <input aria-label="Destination" placeholder="Destination" value={destination} onChange={e => setDestination(e.target.value)} required maxLength={100} style={{ padding: 12, border: '1px solid #dce0e7', borderRadius: 12 }}/>
          <button style={button}>+ Create trip</button>
        </form>
      </section>
      {active && <section style={card}>
        <div style={{ color: '#e66e59', fontWeight: 750, fontSize: 12 }}>YOUR FLEXIBLE PLANNER</div>
        <h2 style={{ fontSize: 28, margin: '8px 0 2px' }}>{active.name}</h2>
        <p style={{ color: '#687487', marginTop: 0 }}>{active.destination} · No fixed schedule required</p>
        <div style={{ display: 'flex', gap: 8, margin: '22px 0', flexWrap: 'wrap' }}>{[['bucket','Trip Bucket'],['days','Day Planner'],['now','What now?']].map(([id,label]) => <button key={id} onClick={() => setTab(id)} style={{ ...button, background: tab === id ? '#2449c7' : '#f1f3f7', color: tab === id ? '#fff' : '#2449c7' }}>{label}</button>)}</div>
        {tab === 'bucket' && <form onSubmit={addPlace} style={{ display: 'flex', gap: 8, marginBottom: 16 }}><input aria-label="Place to save" value={place} onChange={e => setPlace(e.target.value)} placeholder="A café, landmark, or hidden gem…" style={{ flex: 1, minWidth: 0, padding: 12, border: '1px solid #dce0e7', borderRadius: 12 }}/><button style={button}>+ Save</button></form>}
        {tab === 'now' && <p style={{ color: '#687487' }}>Your next adventure, without the pressure. Pick from your saved places below.</p>}
        {tab === 'days' && <p style={{ color: '#687487' }}>Assign places to a day only when you want to.</p>}
        {active.places.length === 0 ? <p style={{ color: '#687487' }}>No places yet. Start by adding something to your Trip Bucket.</p> : <div style={{ display: 'grid', gap: 10 }}>{active.places.filter(p => tab !== 'days' || p.day !== null).map(p => <article key={p.id} style={{ background: '#f6f7fa', borderRadius: 15, padding: 14, display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong style={{ textDecoration: p.visited ? 'line-through' : 'none' }}>{p.name}</strong><button aria-label={'Remove ' + p.name} onClick={() => update(t => ({ ...t, places: t.places.filter(x => x.id !== p.id) }))} style={{ border: 0, background: 'none', color: '#a44', cursor: 'pointer' }}>Remove</button></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <select aria-label={'Priority for ' + p.name} value={p.priority} onChange={e => setPlaceField(p.id, { priority: e.target.value })} style={{ padding: 8, borderRadius: 9 }}><option>Maybe</option><option>Must Go</option><option>Saved for Later</option></select>
            <select aria-label={'Day for ' + p.name} value={p.day ?? ''} onChange={e => setPlaceField(p.id, { day: e.target.value ? Number(e.target.value) : null })} style={{ padding: 8, borderRadius: 9 }}><option value="">Unassigned</option>{Array.from({length:14},(_,i) => <option key={i} value={i+1}>Day {i+1}</option>)}</select>
            <label style={{ fontSize: 13 }}><input type="checkbox" checked={p.visited} onChange={e => setPlaceField(p.id, { visited: e.target.checked })}/> Visited</label>
          </div>
        </article>)}</div>}
      </section>}
      <p style={{ fontSize: 12, color: '#7c8798', marginTop: 18 }}>V2 preview · Saved on this device only. Shared trips, account sync, and expenses are not connected yet. The original dashboard remains at /classic.</p>
    </div>
  </main>;
}
