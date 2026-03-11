// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Search from './components/Search';
import MyPortfolio from './components/MyPortfolio';
import './App.css';

// API base URL - Flask backend
const API_URL = 'http://localhost:5001/api';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home user={user} onLogout={handleLogout} />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/my-portfolio" /> : <Login onLogin={handleLogin} apiUrl={API_URL} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/my-portfolio" /> : <Register onLogin={handleLogin} apiUrl={API_URL} />} 
          />
          <Route path="/search" element={<Search apiUrl={API_URL} user={user} onLogout={handleLogout} />} />
          <Route 
            path="/my-portfolio" 
            element={user ? <MyPortfolio user={user} apiUrl={API_URL} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;