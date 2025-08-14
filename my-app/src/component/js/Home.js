// src/component/js/Home.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, query, orderByChild, limitToLast, onValue, get } from 'firebase/database';
import { auth, rtdb } from '../firebase';

import '../css/home.css';
import '../css/Sidebar.css';

import cloud from '../image/cloudy.png';
import {
  MenuOutlined,
  CloseOutlined,
  LogoutOutlined,
  FileTextOutlined,
  DashboardOutlined,
  SettingOutlined
} from '@ant-design/icons';

import SensorCards from '../js/SenSorCard';

const Home = () => {
  const navigate = useNavigate();
  // 🔧 เปลี่ยนให้ตรงกับโหนดใน RTDB
  const cabinetId = 'CABINET_001';

  // --------- สถานะระบบ/RTDB ----------
  const [rtdbLoading, setRtdbLoading] = useState(true);
  const [rtdbError, setRtdbError] = useState(null);
  const [connected, setConnected] = useState(true);
  const [lastTs, setLastTs] = useState(null);
  const [hadHistory, setHadHistory] = useState(false); // เคยมีประวัติข้อมูลไหม
  const STALE_MS = 2 * 60 * 1000;
  const isStale = lastTs ? (Date.now() - lastTs) > STALE_MS : false;
  const hasData = lastTs !== null; // มีค่าล่าสุดใน state (มาจาก get() หรือ onValue())

  // --------- สถานะ UI/เมนู ----------
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // --------- สถานะเซนเซอร์ ----------
  const [powerOn] = useState(true);
  const [battery] = useState(90);
  const [rain, setRain] = useState(false);
  const [lux, setLux] = useState(0);
  const [temp, setTemp] = useState(0);
  const [humidity, setHumidity] = useState(0);

  // --------- สภาพอากาศ ----------
  const [weather, setWeather] = useState(null);
  const API_KEY = '34981978fff745c0af2bfd42f12172e0'; // ใส่ API Key ของคุณ
  const city = 'Hat Yai';

  const handleLogout = () => {
    navigate('/');
  };

  // เวลา (แสดงใน header)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentTime(formatted);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // ดึงสภาพอากาศครั้งเดียว
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}&lang=en`
        );
        const data = await res.json();  
        setWeather({
          temp: data?.main?.temp,
          humidity: data?.main?.humidity,
          description: data?.weather?.[0]?.description,
          icon: data?.weather?.[0]?.icon,
        });
      } catch (err) {
        console.error('ไม่สามารถดึงข้อมูลสภาพอากาศได้:', err);
      }
    };
    fetchWeather();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ฟังสถานะการเชื่อมต่อ RTDB (.info/connected)
  useEffect(() => {
    const cRef = ref(rtdb, '.info/connected');
    const off = onValue(cRef, (snap) => setConnected(!!snap.val()));
    return () => off();
  }, []);

  // ---------- ล็อกอิน Email/Password -> prefill ด้วย get() -> แล้วค่อย subscribe RTDB ----------
  useEffect(() => {
    // ❗ เปลี่ยนให้เป็นผู้ใช้จริงในโปรเจกต์ของคุณ (หรืออ่านจาก .env/ฟอร์ม)
    const EMAIL = 'projectiot2568@gmail.com';
    const PASSWORD = '0611914120h';

    // ล็อกอินด้วย Email/Password
    signInWithEmailAndPassword(auth, EMAIL, PASSWORD).catch((e) => {
      console.error('Auth error:', e.code, e.message);
      setRtdbLoading(false);
      setRtdbError(
        (e.code === 'auth/invalid-login-credentials' || e.code === 'auth/invalid-credential')
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือผู้ใช้นี้ไม่ได้อยู่ในโปรเจกต์เดียวกับ config ปัจจุบัน'
          : `Auth error: ${e?.message || 'unknown'}`
      );
    });

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const listRef = ref(rtdb, `sensorsData/${cabinetId}`);
      const qLatest = query(listRef, orderByChild('timestamp'), limitToLast(1));

      try {
        // 1) prefill: ดึง “ข้อมูลล่าสุด 1 รายการ” มาก่อน
        const once = await get(qLatest);
        if (once.exists()) {
          const obj = once.val();
          const last = Array.isArray(obj)
            ? obj.filter(Boolean).slice(-1)[0]
            : Object.values(obj).slice(-1)[0];

          if (last && typeof last === 'object') {
            setTemp(typeof last.temperature === 'number' ? Math.round(last.temperature) : null);
            setHumidity(typeof last.humidity === 'number' ? Math.round(last.humidity) : null);
            setLux(typeof last.lightIntensity === 'number' ? Math.round(last.lightIntensity) : null);
            setRain(typeof last.rainDetected === 'boolean' ? last.rainDetected : null);

            let tsMs = null;
            if (typeof last.timestamp === 'number') {
              tsMs = last.timestamp;
            } else if (last.timestamp) {
              const parsed = Date.parse(last.timestamp);
              tsMs = Number.isFinite(parsed) ? parsed : null;
            }
            setLastTs(Number.isFinite(tsMs) ? tsMs : null);
            setHadHistory(true);
          }
        } else {
          // ไม่มีประวัติจริง ๆ
          setHadHistory(false);
        }
      } catch (e) {
        console.error('Prefill get() error:', e);
        setRtdbError(e?.message || 'RTDB get error');
      } finally {
        // จบขั้น prefill
        setRtdbLoading(false);
      }

      // 2) subscribe: ฟัง real-time ต่อ (ไม่ล้างค่าถ้า snapshot ว่าง)
      const unsubRTDB = onValue(
        qLatest,
        (snap) => {
          if (!snap.exists()) {
            // ไม่มีรายการใหม่ ณ ตอนนี้ → คงค่าเดิมไว้
            return;
          }
          const obj = snap.val();
          const last = Array.isArray(obj)
            ? obj.filter(Boolean).slice(-1)[0]
            : Object.values(obj).slice(-1)[0];

          if (!last || typeof last !== 'object') return;

          setTemp(typeof last.temperature === 'number' ? Math.round(last.temperature) : null);
          setHumidity(typeof last.humidity === 'number' ? Math.round(last.humidity) : null);
          setLux(typeof last.lightIntensity === 'number' ? Math.round(last.lightIntensity) : null);
          setRain(typeof last.rainDetected === 'boolean' ? last.rainDetected : null);

          let tsMs = null;
          if (typeof last.timestamp === 'number') {
            tsMs = last.timestamp;
          } else if (last.timestamp) {
            const parsed = Date.parse(last.timestamp);
            tsMs = Number.isFinite(parsed) ? parsed : null;
          }
          setLastTs(Number.isFinite(tsMs) ? tsMs : null);
          setHadHistory(true);
          setRtdbError(null);
        },
        (err) => {
          setRtdbError(err?.message || 'RTDB error');
        }
      );

      return () => unsubRTDB();
    });

    return () => unsubAuth();
  }, [cabinetId]);

  return (
    <div className="container">
      <header>
        <div className="menu" onClick={() => setMenuOpen(true)}>
          <MenuOutlined />
        </div>

        {menuOpen && (
          <>
            <div className="side-menu">
              <div>
                <div className="menu-header">
                  <h2>USER1</h2>
                  <CloseOutlined className="close-icon" onClick={() => setMenuOpen(false)} />
                </div>

                <ul className="menu-list">
                  <li><FileTextOutlined /> HISTORY</li>
                  <li><DashboardOutlined /> DASHBOARD</li>
                  <li><SettingOutlined /> SETTING</li>
                </ul>
              </div>

              <div className="logout">
                <button className="logout-btn" onClick={handleLogout}>
                  <LogoutOutlined /> LOGOUT
                </button>
              </div>
            </div>
            <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
          </>
        )}

        <h1><span className="highlight">HOME</span> AUTODRY</h1>
        <div className="user-info">
          <h1 className="username">USER1</h1>
          <h2 className="datetime">{currentTime}</h2>
        </div>
      </header>

      {/* สรุปสภาพอากาศ */}
      <section className="weather-summary">
        {weather ? (
          <div className="weather-card">
            <div className="weather-top">
              <div className="weather-left">
                <div className="temp-big">{Math.round(weather.temp)}°C</div>
                <div className="desc">{weather.description}</div>
                <div className="date">
                  {new Date().toLocaleDateString('en-GB', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div className="weather-icon">
                <img src={cloud} alt="icon" style={{ width: '200px' }} />
              </div>
            </div>
            <div className="weather-bottom">
              <div className="weather-metric">
                <p>Temperature</p>
                <h3>{Math.round(weather.temp)}°C</h3>
              </div>
              <div className="weather-metric">
                <p>Humidity</p>
                <h3>{weather.humidity}%</h3>
              </div>
              <div className="weather-metric">
                <p>Air Quality</p>
                <h3>(No Data)</h3>
              </div>
            </div>
          </div>
        ) : (
          <p>กำลังโหลดข้อมูลอากาศ...</p>
        )}
      </section>

      {/* การ์ดแสดงค่าสถานี */}
      <SensorCards
        temp={temp}
        humidity={humidity}
        lux={lux}
        rain={rain}
        isStale={isStale}
        hasData={hasData}
      />

      {/* แถบสถานะ RTDB */}
      {rtdbLoading && <div className="banner info">กำลังโหลดข้อมูลจาก RTDB...</div>}

      {!rtdbLoading && !connected && (
        <div className="banner warn">ออฟไลน์: ยังไม่เชื่อมต่อ RTDB</div>
      )}

      {/* ถ้าไม่เคยมีประวัติเลยจริง ๆ (แม้ prefill ก็ว่าง) */}
      {!rtdbLoading && connected && !hadHistory && !rtdbError && (
        <div className="banner neutral">ยังไม่เคยมีข้อมูลในตู้ {cabinetId}</div>
      )}

      {/* ถ้าเคยมีประวัติ และตอนนี้ไม่มีอัปเดตใหม่ → โชว์ค่าเดิม + เตือน stale */}
      {hasData && isStale && (
        <div className="banner warn">
          ข้อมูลเก่ากว่า {STALE_MS / 60000} นาที (timestamp ล่าสุด: {lastTs ? new Date(lastTs).toLocaleString('th-TH') : '-'})
        </div>
      )}

      {rtdbError && (
        <div className="banner error">เกิดข้อผิดพลาด RTDB: {rtdbError}</div>
      )}
    </div>
  );
};

export default Home;
