import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/home.css';
import cloud from '../image/cloudy.png';
import {
  MenuOutlined,
  CloseOutlined,
  LogoutOutlined,
  FileTextOutlined,
  DashboardOutlined,
  SettingOutlined
} from '@ant-design/icons';
import '../css/Sidebar.css';

const Home = () => {
  const navigate = useNavigate();
  const [powerOn, setPowerOn] = useState(true);
  const [rain, setRain] = useState(true);
  const [battery, setBattery] = useState(90);
  const [lux, setLux] = useState(800);
  const [temp, setTemp] = useState(31);
  const [humidity, setHumidity] = useState(40);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };


  useEffect(() => {
    const interval = setInterval(() => {
      setBattery(Math.floor(Math.random() * 30) + 70);
      setLux(Math.floor(Math.random() * 1000) + 200);
      setTemp(Math.floor(Math.random() * 5) + 29);
      setHumidity(Math.floor(Math.random() * 20) + 35);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const [currentTime, setCurrentTime] = useState('');

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

    updateTime(); // เรียกทันทีเมื่อโหลด
    const timer = setInterval(updateTime, 1000); // อัปเดตทุกวินาที

    return () => clearInterval(timer);
  }, []);

  const [weather, setWeather] = useState(null);

  // เปลี่ยนตรงนี้เป็น key ของตัวเอง
  const API_KEY = '34981978fff745c0af2bfd42f12172e0'; //  ใส่ API Key 
  const city = 'Hat Yai'; // เปลี่ยนชื่อเมืองตามต้องการ

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}&lang=en`
          // `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}&lang=th` ภาษาไทย
        );
        const data = await res.json();
        setWeather({
          temp: data.main.temp,
          humidity: data.main.humidity,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
        });
      } catch (err) {
        console.error('ไม่สามารถดึงข้อมูลสภาพอากาศได้:', err);
      }
    };

    fetchWeather();
  }, []);

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
            {/* คลิกพื้นที่ด้านนอกเพื่อปิด */}
            <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
          </>
        )}
        <h1><span className="highlight">HOME</span> AUTODRY</h1>
        <div className="user-info">
          <h1 className="username">USER1</h1>
          <h2 className="datetime">{currentTime}</h2>
        </div>
      </header>

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
                <img
                  src={cloud}
                  alt="icon"
                  style={{ width: '200px' }}
                />
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


      <section className="controls">
        <div className="control-box">
          <p>Order the Clothesline</p>
          <label className="switch">
            <input
              type="checkbox"
              checked={powerOn}
              onChange={() => setPowerOn(!powerOn)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="status-box">
          <p>POWER</p>
          <div className="status-content">
            {/* <span className="icon">🔋</span> */}
            <div className="battery">{battery}%</div>
          </div>
        </div>

        <div className="status-box" onClick={() => setRain(!rain)} style={{ cursor: 'pointer' }}>
          <p>RAIN</p>
          <div className="status-content">
            {/* <span className="icon">🌧️</span> */}
            <div className="rain-status" style={{
              backgroundColor: rain ? "#654ef7" : "#20c997"
            }}>
              {rain ? "Rainning" : "Not a Rain"}
            </div>
          </div>
        </div>

        <div className="status-box">
          <p>LIGHT</p>
          <div className="status-content">
            {/* <span className="icon">☀️</span> */}
            <div className="light-value">{lux} Lux</div>
          </div>
        </div>

        <div className="status-box">
          <p>TEMPERATURE</p>
          <div className="status-content">
            {/* <span className="icon">🌡️</span> */}
            <div className="temp-value">{temp}°C</div>
          </div>
        </div>

        <div className="status-box">
          <p>HUMIDITY</p>
          <div className="status-content">
            {/* <span className="icon">💧</span> */}
            <div className="humidity-value">{humidity}%</div>
          </div>
        </div>
      </section>


      {/* <footer>
        <div className="nav-icon">🏠</div>
        <div className="nav-icon">⏱️</div>
      </footer> */}
    </div>
  );
};

export default Home;
