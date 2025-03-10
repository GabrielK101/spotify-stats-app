import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from './Header/Header.jsx';
import GraphCard from './GraphCard/GraphCard.jsx';
import InfoCard from './InfoCard/InfoCard.jsx';
import Callback from './Callback.jsx';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem("userId") || null); // State to store userId

  // Check localStorage for userId on app load
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  return (
    <>
    <Header userId={userId} setUserId={setUserId} /> {/* Pass setUserId here */}
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
            <>
              <InfoCard userId={userId} />
              <GraphCard title="Weekly Listening" userId={userId} />
            </>
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route path="/callback" element={<Callback setUserId={setUserId} />} />
    </Routes>
    </>
  );
}

export default App;
