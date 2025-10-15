import React from 'react';
import '../../component/css/SenSorCard.css';

// SensorCards.jsx
const fmtNum = (v, suffix = '') => (v === null || v === undefined) ? '—' : `${v}${suffix}`;

const SensorCards = ({ temp1, humidity1, temp2, humidity2, lux, rain, isStale = false, hasData = false }) => {
  const rainDisplay = (rain === true) ? 'ฝนตก' : (rain === false) ? 'ฝนไม่ตก' : 'Unknown';
  const rainActive = rain === true;
  const rainColor = (rain === null) ? '#e5e7eb' : (rainActive ? '#6366f1' : '#20c997');
  const rainText = (rain === null) ? '#6b7280' : '#fff';

  const sensorData = [
    {
      id: 'rain',
      title: 'RAIN',
      displayValue: rainDisplay,
      color: rainColor,
      textColor: rainText,
    },
    { id: 'light', title: 'LIGHT', displayValue: fmtNum(lux, ' Lux'), color: '#f59e0b', textColor: '#fff' },
    { id: 'temperature1', title: 'TEMPERATURE 1', displayValue: fmtNum(temp1, ' °C'), color: '#f97316', textColor: '#fff' },
    { id: 'humidity1', title: 'HUMIDITY 1', displayValue: fmtNum(humidity1, ' %'), color: '#3b82f6', textColor: '#fff' },
    { id: 'temperature2', title: 'TEMPERATURE 2', displayValue: fmtNum(temp2, ' °C'), color: '#ef4444', textColor: '#fff' },
    { id: 'humidity2', title: 'HUMIDITY 2', displayValue: fmtNum(humidity2, ' %'), color: '#2563eb', textColor: '#fff' },
  ];

  return (
    <section className="sensors-grid">
      {/* แถบสถานะรวม */}
      <div className="sensors-status">
        {!hasData ? (
          <span className="badge badge-gray">No data yet</span>
        ) : isStale ? (
          <span className="badge badge-amber">Stale data</span>
        ) : (
          <span className="badge badge-green">Live</span>
        )}
      </div>

      {sensorData.map((s) => (
        <div key={s.id} className={`sensor-card ${(!hasData || isStale) ? 'sensor-card--dim' : ''}`}>
          <div className="sensor-card__header">
            <h3 className="sensor-card__title">{s.title}</h3>
            {s.id === 'rain' && (
              <div className="rain-indicators">
                <span className={`rain-indicator ${rain === true ? 'rain-indicator--active' : ''}`}>ฝนตก</span>
                <span className={`rain-indicator ${rain === false ? 'rain-indicator--active' : ''}`}>ฝนไม่ตก</span>
              </div>
            )}
          </div>

          <div className="sensor-card__content">
            <div
              className="sensor-circle"
              style={{ backgroundColor: s.color, color: s.textColor }}
              aria-label={s.title}
            >
              <span className="sensor-value">{s.displayValue}</span>
            </div>
          </div>

          {/* footer เล็กๆ บอกสถานะ */}
          <div className="sensor-card__footer">
            {!hasData ? 'Waiting for first reading…' : isStale ? 'Last update is old' : 'Live'}
          </div>
        </div>
      ))}
    </section>
  );
};

export default SensorCards;