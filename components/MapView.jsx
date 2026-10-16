'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pin = (col, ic) => L.divIcon({
  className: '',
  html: `<div style="background:${col};width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:13px">${ic}</div>`,
  iconSize: [30, 30], iconAnchor: [15, 15]
});
// ใช้ DOM node แทน string เพื่อไม่ให้ Leaflet ตีความเป็น HTML (กัน XSS)
const tip = (t) => Object.assign(document.createElement('span'), { textContent: t });

export default function MapView({ city, focus }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), mk = useRef([]);

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView([city.lat, city.lng], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    setTimeout(() => map.current && map.current.invalidateSize(), 200);
    return () => { map.current.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current; if (!m) return;
    layer.current.clearLayers(); mk.current = [];
    const pts = [[city.lat, city.lng]];
    mk.current.push(L.marker([city.lat, city.lng], { icon: pin('#E05A47', '🛏️') }).bindTooltip(tip('ย่านพัก: ' + city.name)).addTo(layer.current));
    (city.runs || []).forEach((x) => {
      pts.push([x.lat, x.lng]);
      mk.current.push(L.marker([x.lat, x.lng], { icon: pin(x.t === 'trail' ? '#059669' : '#0ea5e9', x.t === 'trail' ? '⛰️' : '🏃') }).bindTooltip(tip(x.n)).addTo(layer.current));
    });
    m.invalidateSize();
    pts.length > 1 ? m.flyToBounds(pts, { padding: [30, 30], duration: 1, maxZoom: 13 }) : m.flyTo(pts[0], 13);
  }, [city]);

  useEffect(() => {
    if (!focus || !map.current) return;
    const x = city.runs[focus.i]; if (!x) return;
    map.current.flyTo([x.lat, x.lng], 14, { duration: 1 });
    const m = mk.current[focus.i + 1]; if (m) m.openTooltip();
  }, [focus]);

  return <div ref={el} className="h-full w-full min-h-[280px] rounded-xl" />;
}
