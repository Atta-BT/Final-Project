// src/component/js/Home.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, query, orderByChild, limitToLast, onValue, get, set } from 'firebase/database';
import { auth, rtdb } from '../firebase';
import { ClockCircleOutlined } from '@ant-design/icons';
import '../css/home.css';
import '../css/Sidebar.css';
import cloud from '../image/cloudy.png';
import {
  MenuOutlined,
  CloseOutlined,
  LogoutOutlined,
  FileTextOutlined,
  DashboardOutlined,
  SettingOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import SensorCards from '../js/SenSorCard';

const Home = () => {
  const navigate = useNavigate();

  // 🔧 cabinet id ที่ใช้ใน RTDB
  const cabinetId = 'CABINET_001';

  // --------- สถานะระบบ/RTDB ----------
  const [rtdbLoading, setRtdbLoading] = useState(true);
  const [rtdbError, setRtdbError] = useState(null);
  const [connected, setConnected] = useState(true);
  const [lastTs, setLastTs] = useState(null);
  const [hadHistory, setHadHistory] = useState(false);
  const STALE_MS = 2 * 60 * 1000;
  const isStale = lastTs ? Date.now() - lastTs > STALE_MS : false;
  const hasData = lastTs !== null;

  // --------- UI ----------
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // --------- ค่าเซนเซอร์ ----------
  const [rain, setRain] = useState(false);
  const [lux, setLux] = useState(0);
  const [temp1, setTemp1] = useState(0);
  const [humidity1, setHumidity1] = useState(0);
  const [temp2, setTemp2] = useState(0);
  const [humidity2, setHumidity2] = useState(0);

  // --------- สภาพอากาศ ----------
  const [weather, setWeather] = useState(null);
  const API_KEY = '34981978fff745c0af2bfd42f12172e0';
  const city = 'Hat Yai';

  // เวลา (header)
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
    (async () => {
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
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ฟังสถานะการเชื่อมต่อ RTDB (.info/connected)
  useEffect(() => {
    const cRef = ref(rtdb, '.info/connected');
    const off = onValue(cRef, (snap) => setConnected(!!snap.val()));
    return () => off();
  }, []);

  // 🔐 ใช้ session ที่มีอยู่แล้ว → อ่าน RTDB (prefill + subscribe)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // ยังไม่ได้ล็อกอิน → ส่งกลับหน้า login
        navigate('/login', { replace: true });
        return;
      }

      const listRef = ref(rtdb, `sensorsData/${cabinetId}`);
      const qLatest = query(listRef, orderByChild('timestamp'), limitToLast(1));

      try {
        // 1) prefill รายการล่าสุด
        const once = await get(qLatest);
        if (once.exists()) {
          const obj = once.val();
          const last = Array.isArray(obj)
            ? obj.filter(Boolean).slice(-1)[0]
            : Object.values(obj).slice(-1)[0];

          if (last && typeof last === 'object') {
            setTemp1(typeof last.temperature1 === 'number' ? Math.round(last.temperature1) : null);
            setHumidity1(typeof last.humidity1 === 'number' ? Math.round(last.humidity1) : null);
            setTemp2(typeof last.temperature2 === 'number' ? Math.round(last.temperature2) : null);
            setHumidity2(typeof last.humidity2 === 'number' ? Math.round(last.humidity2) : null);
            setLux(typeof last.lightIntensity === 'number' ? Math.round(last.lightIntensity) : null);
            setRain(typeof last.rainDetected === 'boolean' ? last.rainDetected : null);

            let tsMs = null;
            if (typeof last.timestamp === 'number') tsMs = last.timestamp;
            else if (last.timestamp) {
              const parsed = Date.parse(last.timestamp);
              tsMs = Number.isFinite(parsed) ? parsed : null;
            }
            setLastTs(Number.isFinite(tsMs) ? tsMs : null);
            setHadHistory(true);
          }
        } else {
          setHadHistory(false);
        }
      } catch (e) {
        console.error('Prefill get() error:', e);
        setRtdbError(e?.message || 'RTDB get error');
      } finally {
        setRtdbLoading(false);
      }

      // 2) subscribe real-time
      const unsubRTDB = onValue(
        qLatest,
        (snap) => {
          if (!snap.exists()) return;
          const obj = snap.val();
          const last = Array.isArray(obj)
            ? obj.filter(Boolean).slice(-1)[0]
            : Object.values(obj).slice(-1)[0];
          if (!last || typeof last !== 'object') return;

          setTemp1(typeof last.temperature1 === 'number' ? Math.round(last.temperature1) : null);
          setHumidity1(typeof last.humidity1 === 'number' ? Math.round(last.humidity1) : null);
          setLux(typeof last.lightIntensity === 'number' ? Math.round(last.lightIntensity) : null);
          setRain(typeof last.rainDetected === 'boolean' ? last.rainDetected : null);

          let tsMs = null;
          if (typeof last.timestamp === 'number') tsMs = last.timestamp;
          else if (last.timestamp) {
            const parsed = Date.parse(last.timestamp);
            tsMs = Number.isFinite(parsed) ? parsed : null;
          }
          setLastTs(Number.isFinite(tsMs) ? tsMs : null);
          setHadHistory(true);
          setRtdbError(null);
        },
        (err) => setRtdbError(err?.message || 'RTDB error')
      );

      // ทำความสะอาดเมื่อออกจากหน้า/เปลี่ยนผู้ใช้
      return () => unsubRTDB();
    });

    return () => unsubscribeAuth();
  }, [cabinetId, navigate]);

  // --------- Logout: เขียน history แล้วค่อย signOut ----------
  const writeHistory = async (status) => {
    const user = auth.currentUser;
    if (!user) return;
    const hid = `HIS_${Date.now()}`;
    const iso = new Date().toISOString();
    await set(ref(rtdb, `history/${hid}`), {
      id: hid,
      timestamp: iso,
      userId: user.uid,
      status
    });
  };

  const handleLogout = async () => {
    try { await writeHistory('Logout'); } catch (e) { console.error(e); }
    await signOut(auth);
    navigate('/', { replace: true });
  };

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
                  <h2>USER</h2>
                  <CloseOutlined className="close-icon" onClick={() => setMenuOpen(false)} />
                </div>

                <ul className="menu-list">
                  <li onClick={() => navigate('/home')}><HomeOutlined />HOME AUTODRY</li>
                  <li onClick={() => navigate('/history')}><FileTextOutlined /> HISTORY</li>
                  <li  onClick={() => navigate('/dashboard')}><DashboardOutlined /> DASHBOARD</li>
                  <li><SettingOutlined /> SETTING</li>
                  <li onClick={() => { setMenuOpen(false); navigate('/time'); }}>
                    <ClockCircleOutlined /> TIME SETTING
                  </li>
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
          <h1 className="username">USER</h1>
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
        temp1={temp1}
        humidity1={humidity1}
        temp2={temp2}
        humidity2={humidity2}
        lux={lux}
        rain={rain}
        isStale={isStale}
        hasData={hasData}
      />

      {/* แถบสถานะ RTDB */}
      {rtdbLoading && <div className="banner info">กำลังโหลดข้อมูลจาก RTDB...</div>}
      {!rtdbLoading && !connected && <div className="banner warn">ออฟไลน์: ยังไม่เชื่อมต่อ RTDB</div>}
      {!rtdbLoading && connected && !hadHistory && !rtdbError && (
        <div className="banner neutral">ยังไม่เคยมีข้อมูลในตู้ {cabinetId}</div>
      )}
      {hasData && isStale && (
        <div className="banner warn">
          ข้อมูลเก่ากว่า {STALE_MS / 60000} นาที (ล่าสุด: {lastTs ? new Date(lastTs).toLocaleString('th-TH') : '-'})
        </div>
      )}
      {rtdbError && <div className="banner error">เกิดข้อผิดพลาด RTDB: {rtdbError}</div>}
    </div>
  );
};

export default Home;