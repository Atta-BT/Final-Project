import React, { useState } from 'react';
import '../css/Login.css';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import Logo from '../image/logo.png';
import Picture from '../image/piclogin.png';

const Login = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignIn = async () => {
        try {
            const res = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                console.log('✅ เข้าระบบสำเร็จ:', data.user);
                navigate('/home');
            } else {
                setError(data.message); // แสดงข้อความจาก backend
            }
        } catch (err) {
            setError('Server error');
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

            <div className="form-section">
                <div className="input-box">
                    <FaUser className="icon" />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="input-box">
                    <FaLock className="icon" />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}
                <button className="sign-in-btn" onClick={handleSignIn}>SIGN IN</button>
            </div>

            <p className="about-link">ABOUT THIS</p>
        </div>
    );
};

export default Login;
