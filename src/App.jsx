import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./Header/Header";
import Callback from "./Callback";
import Dashboard from "./Screens/Dashboard";
import Profile from "./Screens/Profile";
import "./Styles/Layout.css"; // New layout styles

function App() {
  const [userId, setUserId] = useState(localStorage.getItem("userId") || null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  
  // Determine current page for class application
  const getPageClass = () => {
    const path = location.pathname;
    if (path === "/profile") return "profile-page";
    if (path === "/dashboard" || path === "/") return "dashboard-page";
    return "default-page";
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  return (
    <div className={`app-container ${getPageClass()}`}>
      <Header userId={userId} setUserId={setUserId} setUser={setUser} />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              userId ? (
                <Navigate to="/dashboard" />
              ) : (
                <div className="login-message">
                  <p>Please log in to view your dashboard.</p>
                </div>
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              userId ? (
                <Dashboard userId={userId} user={user} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/profile"
            element={
              userId ? (
                <Profile userId={userId} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="/callback" element={<Callback setUserId={setUserId} setUser={setUser} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
