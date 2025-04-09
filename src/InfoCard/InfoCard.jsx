import './InfoCard.css';
import { useEffect, useState } from "react";
import { getListeningDataForDay, getListeningDataForWeek } from "../getListeningData";

const today = new Date().toISOString().split("T")[0];

function InfoCard({ userId, title, dataType }) {
  const [weeklyData, setWeeklyData] = useState({ minutes: null, songs: null, artists: null });
  const [dailyData, setDailyData] = useState({songs: null, minutes: null});


  useEffect(() => {
    async function fetchData() {
      if (userId) {
        const data = await getListeningDataForDay(userId, today);
        const rawData = data.map(entry => ({
          date: today,
          duration: entry.duration,
          artistName: entry.artist,
          artistId: entry.artist_id,
          songName: entry.song,
          songId: entry.song_id
        }));
        const totalMinutes = rawData.reduce((sum, entry) => sum + entry.duration / 60000, 0);
        const totalSongs = rawData.length;

        setDailyData({ minutes: Math.round(totalMinutes), songs: totalSongs });
      }
    }
    fetchData();
  }, [userId]);

  useEffect(() => {
    async function fetchData() {
      if (userId) {
        const data = await getListeningDataForWeek(userId, today);
  
        const rawData = data.map(entry => ({
          date: today,
          duration: entry.duration,
          artistName: entry.artistName,
          artistId: entry.artistId,
          songImage: entry.image,
          songName: entry.songName,
          songId: entry.songId
        }));
  
        // Count occurrences of each song
        const songCounts = {};
        const artistCounts = {};
  
        rawData.forEach(({ songName, artistName, songImage }) => {
          if (!songCounts[songName]) {
            songCounts[songName] = { count: 0, image: songImage, artist: artistName };
          }
          songCounts[songName].count += 1;

          artistCounts[artistName] = (artistCounts[artistName] || 0) + 1;
        });
        
        // Get top 5 songs
        const topSongs = Object.entries(songCounts)
          .sort((a, b) => b[1].count - a[1].count) // Sort by count descending
          .slice(0, 5)
          .map(([song, { count, image, artist }]) => ({ song, count, image, artist }));
  
        // Get top 5 artists
        const topArtists = Object.entries(artistCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([artist, count]) => ({ artist, count }));
  
        const totalMinutes = rawData.reduce((sum, entry) => sum + entry.duration / 60000, 0);
        setWeeklyData({
          minutes: Math.round(totalMinutes),
          songs: topSongs,
          artists: topArtists
        });
      }
    }
    fetchData();
  }, [userId, dataType]);

  return (
    <div className="info-card">
      <h2>{title}</h2>
        {dataType === "minutes" && (
          <>
          <div className="stats-container">
            <div className="stat">
              <h3>Minutes</h3>
              <p>{dailyData.minutes !== null ? dailyData.minutes : "Loading..."}</p>
            </div>
            <div className="stat">
              <h3>Songs Played</h3>
              <p>{dailyData.songs !== null ? dailyData.songs : "Loading..."}</p>
            </div>
          </div>
          <h2>Top Artists</h2>
          <div className="stats-container">
            <div className="stat">
              <h3>This Week</h3>
              {weeklyData.artists ? (
                <ol>
                  {weeklyData.artists.map((artist, index) => (
                    <li key={index}>
                      {artist.artist} ({artist.count} plays)
                    </li>
                  ))}
                </ol>
              ) : (
                "Loading..."
              )}
            </div>
          </div>
          </>
        )}
        {dataType === "songs" && (
          <div className="stats-container">
            <div className="stat">
              <h3>This Week</h3>
              {weeklyData.songs ? (
                <ol>
                  {weeklyData.songs.map((song, index) => (
                    <li key={index} className="song-item">
                      <img 
                        src={song.image} 
                        alt={song.song} 
                        className="song-image" 
                      />
                      <div className="song-details">
                        <span className="song-name">{song.song}</span>
                        <span className="song-artist">{song.artist}</span>
                        <span className="song-plays">{song.count} plays</span>
                      </div>
                  </li>
                  ))}
                </ol>
              ) : (
                "Loading..."
              )}
            </div>
          </div>
        )}
        {dataType === "artists" && (
          <>
          <div className="stats-container">
            <div className="stat">
              <h3>This Week</h3>
              {weeklyData.artists ? (
                <ol>
                  {weeklyData.artists.map((artist, index) => (
                    <li key={index}>
                      {artist.artist} ({artist.count} plays)
                    </li>
                  ))}
                </ol>
              ) : (
                "Loading..."
              )}
            </div>
          </div>
          <div className="stats-container">
            <div className="stat">
              <h3>Minutes</h3>
              <p>{dailyData.minutes !== null ? dailyData.minutes : "Loading..."}</p>
            </div>
            <div className="stat">
              <h3>Songs Played</h3>
              <p>{dailyData.songs !== null ? dailyData.songs : "Loading..."}</p>
            </div>
          </div>
          </>
        )}
      </div>
  );
}

export default InfoCard;
