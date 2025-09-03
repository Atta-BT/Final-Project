import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, rtdb } from '../firebase';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import '../css/Login.css';
import Logo from '../image/logo.png';
import Picture from '../image/piclogin.png';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ฟังก์ชันเขียน history
  const writeHistory = async (status, user) => {
    if (!user) return;
    const hid = `HIS_${Date.now()}`;
    const iso = new Date().toISOString(); // timestamp รูปแบบ ISO
    await set(ref(rtdb, `history/${hid}`), {
      id: hid,
      timestamp: iso,
      userId: user.uid,
      status
    });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('กรอกอีเมลและรหัสผ่าน');

    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // เก็บ token ไว้ถ้าจะใช้เรียก REST API
      const idToken = await user.getIdToken();
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('uid', user.uid);

      // ✅ เขียน history = Login
      await writeHistory('Login', user);

      navigate('/home');
    } catch (err) {
      const code = err.code || '';
      const message =
        code === 'auth/invalid-email' ? 'อีเมลไม่ถูกต้อง' :
        code === 'auth/user-not-found' ? 'ไม่พบบัญชีผู้ใช้' :
        code === 'auth/wrong-password' ? 'รหัสผ่านไม่ถูกต้อง' :
        code === 'auth/too-many-requests' ? 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ภายหลัง' :
        err.message || 'เข้าสู่ระบบล้มเหลว';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="image-section">
        <img src={Logo} alt="Logo" className="clothes-img" />
      </div>

      <div className="image">
        <img src={Picture} alt="Login art" />
      </div>

      <form className="form-section" onSubmit={handleSignIn}>
        <div className="input-box">
          <FaUser className="icon" />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="input-box">
          <FaLock className="icon" />
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="toggle-pw"
            onClick={() => setShowPw((v) => !v)}
          >
            {showPw ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

        <button className="sign-in-btn" type="submit" disabled={loading}>
          {loading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>
      </form>
    </div>
  );
}
