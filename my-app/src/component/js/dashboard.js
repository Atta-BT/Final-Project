import React, { useEffect, useState } from 'react';
import { getDatabase, ref, query, orderByChild, limitToLast, onValue } from 'firebase/database';
import firebaseApp from '../firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import dayjs from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const COLORS = {
  temp1: 'rgba(255,99,132,0.9)',
  temp2: 'rgba(54,162,235,0.9)',
  hum1: 'rgba(75,192,192,0.9)',
  hum2: 'rgba(153,102,255,0.9)',
  light: 'rgba(255,206,86,0.9)',
};

const metricDefs = [
  { key: 'temp1', label: 'Temp1 (°C)' },
  { key: 'temp2', label: 'Temp2 (°C)' },
  { key: 'hum1', label: 'Hum1 (%)' },
  { key: 'hum2', label: 'Hum2 (%)' },
  { key: 'light', label: 'Light' },
];

const Dashboard = ({ cabinetId = 'CABINET_001', limit = 50 }) => {
  const [rows, setRows] = useState([]);
  const [visible, setVisible] = useState({
    temp1: true,
    temp2: true,
    hum1: true,
    hum2: true,
    light: true,
  });
  const db = getDatabase(firebaseApp);

  useEffect(() => {
    const q = query(
      ref(db, `sensorsData/${cabinetId}`),
      orderByChild('timestamp'),
      limitToLast(limit)
    );

    const unsubscribe = onValue(q, (snap) => {
      const val = snap.val();
      if (!val) {
        setRows([]);
        return;
      }
      const arr = Object.values(val)
        .map((r) => ({
          timestamp: r.timestamp,
          temp1: r.temperature1 ?? r.temperature_1 ?? r.temp1 ?? null,
          temp2: r.temperature2 ?? r.temperature_2 ?? r.temp2 ?? null,
          hum1: r.humidity1 ?? r.humidity_1 ?? r.hum1 ?? null,
          hum2: r.humidity2 ?? r.humidity_2 ?? r.hum2 ?? null,
          light: r.lightIntensity ?? r.light ?? null,
        }))
        .filter((r) => r.timestamp)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setRows(arr);
    }, (err) => {
      console.error('onValue error (dashboard):', err);
      setRows([]);
    });

    return () => unsubscribe();
  }, [db, cabinetId, limit]);

  const labels = rows.map((r) => dayjs(r.timestamp).format('HH:mm:ss'));

  const makeSingleData = (key, label) => ({
    labels,
    datasets: [
      {
        label,
        data: rows.map((r) => (r[key] != null ? Number(r[key]) : null)),
        borderColor: COLORS[key],
        backgroundColor: COLORS[key],
        tension: 0.2,
        spanGaps: true,
        pointRadius: 2,
      },
    ],
  });

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    plugins: {
      legend: { display: false },
      title: { display: true, text: title },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { display: true, title: { display: false } },
      y: { display: true, title: { display: true, text: 'Value' } },
    },
  });

  return (
    <div style={{ padding: 12 }}>
      <h2>Dashboard - Sensors</h2>
      <p>Cabinet: {cabinetId} — Showing last {limit} records</p>

      <div style={{ marginBottom: 8 }}>
        {metricDefs.map(m => (
          <label key={m.key} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={!!visible[m.key]}
              onChange={() => setVisible(v => ({ ...v, [m.key]: !v[m.key] }))}
            />{' '}
            {m.label}
          </label>
        ))}
      </div>

      <div>
        {metricDefs.map(m => visible[m.key] && (
          <div key={m.key} style={{ height: 260, marginBottom: 18, border: '1px solid #eee', padding: 8 }}>
            <Line data={makeSingleData(m.key, m.label)} options={chartOptions(`${m.label} — ${cabinetId}`)} />
          </div>
        ))}
        {/* If none selected, show combined overview */}
        {Object.values(visible).every(v => !v) && (
          <div style={{ height: 420 }}>
            <Line
              data={{
                labels,
                datasets: metricDefs.map(m => ({
                  label: m.label,
                  data: rows.map(r => (r[m.key] != null ? Number(r[m.key]) : null)),
                  borderColor: COLORS[m.key],
                  backgroundColor: COLORS[m.key],
                  tension: 0.2,
                  spanGaps: true,
                  pointRadius: 2,
                })),
              }}
              options={{
                ...chartOptions(`Combined — ${cabinetId}`),
                plugins: { ...chartOptions().plugins, legend: { display: true, position: 'top' } },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;