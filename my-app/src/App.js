import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './component/js/Login';
import Home from './component/js/Home';
import TimeSetting from './component/js/TimeSetting';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/time" element={<TimeSetting />} />
      </Routes>
    </Router>
  );
}

export default App;
