// src/pages/TimeSetting.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, rtdb } from '../firebase';
import { ref, onValue, set, update, remove, get, child } from 'firebase/database';

import {
  MenuOutlined,
  CloseOutlined,
  LogoutOutlined,
  FileTextOutlined,
  DashboardOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  HomeOutlined,
} from '@ant-design/icons';

import '../css/TimeSetting.css';
import '../css/Sidebar.css';

const cabinetId = 'CABINET_001';
const basePath = `timeSet/${cabinetId}`;

function normalizeHHMM(s) {
  if (!s) return '00:00';
  const [h, m] = String(s).split(':');
  return `${String(h ?? '00').padStart(2, '0')}:${String(m ?? '00').padStart(2, '0')}`;
}

export default function TimeSetting() {
  const navigate = useNavigate();

  // ตรวจสิทธิ์
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/login', { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  // เมนู
  const [menuOpen, setMenuOpen] = useState(false);

  // ฟอร์ม
  const [start, setStart] = useState('12:45');
  const [end, setEnd] = useState('16:45');
  const [mode, setMode] = useState('auto');
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState({});

  const list = useMemo(() => {
    const arr = Object.entries(items || {}).map(([id, v]) => ({ id, ...(v || {}) }));
    arr.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
    return arr;
  }, [items]);

  // ดึงข้อมูล timeSet
  useEffect(() => {
    const listRef = ref(rtdb, basePath);
    const off = onValue(
      listRef,
      (snap) => {
        setItems(snap.val() || {});
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => off();
  }, []);

  // ฟังก์ชันเขียน
  const handleAdd = async () => {
    const s = normalizeHHMM(start);
    const e = normalizeHHMM(end);
    const id = `TW_${Date.now()}`;
    await set(ref(rtdb, `${basePath}/${id}`), {
      start: s,
      end: e,
      enabled: !!enabled,
      mode: mode === 'schedule' ? 'schedule' : 'auto',
    });
  };

  const handleToggle = async (id, cur) =>
    await update(ref(rtdb, `${basePath}/${id}`), { enabled: !cur });

  const handleModeChange = async (id, cur) =>
    await update(ref(rtdb, `${basePath}/${id}`), { mode: cur === 'auto' ? 'schedule' : 'auto' });

  const handleDelete = async (id) => await remove(ref(rtdb, `${basePath}/${id}`));

  const handleDeleteAll = async () => {
    if (window.confirm('Delete all time windows?')) await remove(ref(rtdb, basePath));
  };

  // เวลาอัปเดตล่าสุด
  const [lastUpdate, setLastUpdate] = useState(null);
  useEffect(() => {
    const lastRef = ref(rtdb, `sensorsData/${cabinetId}`);
    get(child(lastRef, '/')).then((snap) => {
      const v = snap.val();
      if (!v) return;
      const last = Object.values(v).slice(-1)[0];
      if (last?.timestamp) setLastUpdate(last.timestamp);
    });
  }, []);

  // logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/', { replace: true });
  };

  return (
    <div className="time-page">
      <div className="container">
        <header className="time-header">
          {/* ปุ่มเปิดเมนู */}
          <div className="menu" onClick={() => setMenuOpen(true)}>
            <MenuOutlined />
          </div>

          <h1 className="time-title">
            <span className="highlight">TIME</span> SETTING
          </h1>
          <div className="time-meta">
            <ClockCircleOutlined />{' '}
            {lastUpdate ? new Date(lastUpdate).toLocaleString('th-TH') : '—'}
          </div>
        </header>

        {/* Side Menu */}
        {menuOpen && (
          <>
            <div className="side-menu">
              <div className="menu-header">
                <h2>USER</h2>
                <CloseOutlined className="close-icon" onClick={() => setMenuOpen(false)} />
              </div>
              <ul className="menu-list">
                <li onClick={() => navigate('/home')}>
                  <HomeOutlined />HOME AUTODRY</li>
                <li onClick={() => navigate('/history')}>
                  <FileTextOutlined />HISTORY</li>
                <li>
                  <DashboardOutlined />DASHBOARD</li>
                <li>
                  <SettingOutlined />SETTING</li>
                <li>
                  <ClockCircleOutlined /> TIME SETTING</li>
              </ul>
              <div className="logout">
                <button className="logout-btn" onClick={handleLogout}>
                  <LogoutOutlined /> LOGOUT
                </button>
              </div>
            </div>
            <div className="side-overlay" onClick={() => setMenuOpen(false)} />
          </>
        )}

        {/* Content */}
        <main className="time-content">
          <section className="time-card">
            <h3>Set Collection Time</h3>
            <div className="time-grid">
              <div className="time-field">
                <label>START</label>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="time-field">
                <label>END</label>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
              <div className="time-field">
                <label>MODE</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="auto">AUTO (อนุญาตเซนเซอร์ในช่วง)</option>
                  <option value="schedule">SCHEDULE (บังคับเข้า/ออกตามเวลา)</option>
                </select>
              </div>

              <div className="time-switch-inline">
                <label className="toggle" title="Enabled">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    aria-label="Enable time window"
                  />
                  <span className="bg" aria-hidden="true"></span>
                  <span className="knob" aria-hidden="true"></span>
                </label>
                <span style={{ fontWeight: 700 }}>{enabled ? 'On' : 'Off'}</span>
              </div>

              <button className="time-add-btn" onClick={handleAdd}>
                <PlusOutlined /> ADD
              </button>
            </div>
          </section>

          {loading ? (
            <div className="time-banner info">กำลังโหลดรายการเวลา…</div>
          ) : list.length === 0 ? (
            <div className="time-empty">ยังไม่มีการตั้งเวลา</div>
          ) : (
            <div className="time-list">
              {list.map((tw) => (
                <div className="time-item" key={tw.id}>
                  <div className="left">
                    <div className="range">
                      {tw.start} - {tw.end}
                    </div>
                    <div className="meta">
                      mode: <b>{tw.mode || 'auto'}</b>
                    </div>
                  </div>

                  <div className="time-actions">
                    <label className="toggle" title="Enabled">
                      <input
                        type="checkbox"
                        checked={!!tw.enabled}
                        onChange={() => handleToggle(tw.id, !!tw.enabled)}
                        aria-label={`Toggle ${tw.start}-${tw.end}`}
                      />
                      <span className="bg" aria-hidden="true"></span>
                      <span className="knob" aria-hidden="true"></span>
                    </label>

                    <button
                      className="time-chip"
                      onClick={() => handleModeChange(tw.id, tw.mode || 'auto')}
                    >
                      {(tw.mode || 'auto').toUpperCase()}
                    </button>

                    <button
                      className="time-delete"
                      onClick={() => handleDelete(tw.id)}
                      title="Delete"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {list.length > 0 && (
            <div className="time-delete-all-wrap">
              <button className="time-delete-all" onClick={handleDeleteAll}>
                <DeleteOutlined /> DELETE ALL
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}