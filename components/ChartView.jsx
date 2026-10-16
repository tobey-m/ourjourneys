'use client';
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function ChartView({ labels, data, activeIdx }) {
  const ref = useRef(null), ch = useRef(null);
  useEffect(() => {
    ch.current = new Chart(ref.current, {
      type: 'bar',
      data: { labels: [], datasets: [{ data: [], borderRadius: 8, maxBarThickness: 40 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (x) => ' ฿' + Math.round(x.raw).toLocaleString('th-TH') } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
      }
    });
    return () => ch.current.destroy();
  }, []);
  useEffect(() => {
    const c = ch.current; if (!c) return;
    c.data.labels = labels;
    c.data.datasets[0].data = data;
    c.data.datasets[0].backgroundColor = labels.map((_, i) => (i === activeIdx ? '#E05A47' : '#fecaca'));
    c.update();
  }, [labels, data, activeIdx]);
  return <canvas ref={ref} />;
}
