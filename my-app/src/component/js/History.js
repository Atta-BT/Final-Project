import React, { useEffect, useState } from 'react';
import { getDatabase, ref, query, orderByChild, equalTo, get } from 'firebase/database'; // removed onValue
import { getAuth } from 'firebase/auth';
import firebaseApp from '../firebase';
import '../css/history.css';
import { useNavigate } from 'react-router-dom';
import {
  MenuOutlined,
  CloseOutlined,
  LogoutOutlined,
  FileTextOutlined,
  DashboardOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  HomeOutlined,
} from '@ant-design/icons';

const History = () => {
  const [history, setHistory] = useState([]);
  const [uid, setUid] = useState('');
  const db = getDatabase(firebaseApp);

  useEffect(() => {
    console.log('History useEffect start');
    console.log('firebaseApp.options:', firebaseApp?.options); // show config (check databaseURL)
    const auth = getAuth(firebaseApp);
    let unsubscribeHistory = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      console.log('onAuthStateChanged fired, user:', user);
      if (unsubscribeHistory) {
        try { unsubscribeHistory(); } catch (e) { console.warn('unsubscribeHistory error', e); }
        unsubscribeHistory = null;
      }

      if (user) {
        setUid(user.uid);
        // debug token + dbUrl
        try {
          const idToken = await user.getIdToken(true);
          const dbUrl = (firebaseApp?.options?.databaseURL || '').replace(/\/$/, '');
          console.log('debug idToken present:', !!idToken, 'dbUrl:', dbUrl);
        } catch (e) {
          console.error('getIdToken error', e);
        }

        const q = query(ref(db, 'history'), orderByChild('userId'), equalTo(user.uid));
        try {
          const snap = await get(q);
          console.log('get(q) result exists:', snap.exists(), 'val:', snap.val());
          if (snap.exists()) {
            const data = snap.val();
            const arr = Object.entries(data).map(([k, v]) => ({ key: k, ...v }));
            arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setHistory(arr);
          } else {
            setHistory([]);
          }
        } catch (err) {
          console.error('get(q) error:', err);
          setHistory([]);
        }
      } else {
        setUid('');
        setHistory([]);
      }
    });

    return () => {
      try { unsubscribeAuth(); } catch (e) { console.warn('unsubscribeAuth error', e); }
      if (unsubscribeHistory) {
        try { unsubscribeHistory(); } catch (e) { console.warn('unsubscribeHistory cleanup error', e); }
      }
    };
  }, [db]);

  return (
    <div>
      <h2>ประวัติการเข้าใช้งาน</h2>
      <p>UID ที่ login: {uid || 'ยังไม่ได้ login'}</p>
      <ul>
        {history.length === 0 ? (
          <li>ไม่พบข้อมูลประวัติการเข้าใช้งาน</li>
        ) : (
          history.map(item => (
            <li key={item.id || item.key}>
              <strong>สถานะ:</strong> {item.status || 'ไม่ระบุ'}<br />
              <strong>เวลา:</strong> {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'ไม่ระบุ'}<br />
              <strong>User ID:</strong> {item.userId || 'ไม่ระบุ'}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default History;
