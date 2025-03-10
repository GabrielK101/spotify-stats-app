import './InfoCard.css';
import { useEffect, useState } from "react";
import { getListeningDataForDay } from "../getListeningData";

const today = new Date().toISOString().split("T")[0];

function InfoCard({ userId }) {
  const [stats, setStats] = useState({ minutes: null, songs: null });

  useEffect(() => {
    async function fetchData() {
      if (userId) {
        const data = await getListeningDataForDay(userId, today);
        const totalMinutes = data.reduce((sum, entry) => sum + entry.duration_ms / 60000, 0);
        const totalSongs = data.length;
        setStats({ minutes: Math.round(totalMinutes), songs: totalSongs });
      }
    }
    fetchData();
  }, [userId]);


  return (
    <div className="info-card">
      <h2>Today's Stats</h2>
      <div className="stats-container">
        <div className="stat">
          <h3>Minutes</h3>
          <p>{stats.minutes !== null ? stats.minutes : "Loading..."}</p>
        </div>
        <div className="stat">
          <h3>Songs Played</h3>
          <p>{stats.songs !== null ? stats.songs : "Loading..."}</p>
        </div>
      </div>
    </div>
  );
}

export default InfoCard;
