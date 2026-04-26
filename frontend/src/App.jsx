import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    setIsAuthenticated(!!token);
    setUserRole(role);
  }, []);

  const handleLogin = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <Router>
      <div className="app">
        {isAuthenticated && (
          <nav className="navbar">
            <div className="nav-container">
              <h1 className="nav-title">Medical Dashboard</h1>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </nav>
        )}

        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate
                  to={
                    userRole === 'patient'
                      ? '/patient-dashboard'
                      : userRole === 'provider'
                      ? '/provider-dashboard'
                      : '/admin-dashboard'
                  }
                />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/patient-dashboard"
            element={
              isAuthenticated && userRole === 'patient' ? (
                <PatientDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/provider-dashboard"
            element={
              isAuthenticated && userRole === 'provider' ? (
                <ProviderDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <AdminDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate
                  to={
                    userRole === 'patient'
                      ? '/patient-dashboard'
                      : userRole === 'provider'
                      ? '/provider-dashboard'
                      : '/admin-dashboard'
                  }
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
