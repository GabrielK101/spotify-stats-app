import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./Header/Header";
import Callback from "./Callback";
import Dashboard from "./Screens/Dashboard";

function App() {
  const [userId, setUserId] = useState(localStorage.getItem("userId") || null); // State to store userId
  const [user, setUser] = useState(null); // State to store user data

  // Check localStorage for userId on app load
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  return (
    <>
    <Header userId={userId} setUserId={setUserId} setUser={setUser} /> {/* Pass setUserId here */}
    <Routes>
      <Route
        path="/"
        element={
          userId ? (
            <Navigate to="/dashboard" />
          ) : (
            <div>
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
      <Route path="/callback" element={<Callback setUserId={setUserId} setUser={setUser} />} />
    </Routes>
    </>
  );
}

export default App;
