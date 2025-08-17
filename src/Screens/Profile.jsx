import React, { useEffect, useState } from "react";
import getUserData from "../getUserData";
import { getListeningData, getListeningDataForWeek } from "../getListeningData";
import Shelf from "../Components/Shelf";
import '../Styles/Profile.css';

function Profile({ userId }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statsData, setStatsData] = useState({
        topArtists: null,
        topSongs: null,
        weeklyTotal: null,
        totalMinutes: null,
        totalSongs: null
    });

    useEffect(() => {
        async function fetchUserData() {
            if (!userId) {
                setError("No user ID provided");
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                const userData = await getUserData(userId);
                if (userData) {
                    setUser(userData);
                    setError(null);
                } else {
                    setError("User data not found");
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        }
        
        fetchUserData();
    }, [userId]);

    // Fetch all listening statistics
    useEffect(() => {
        async function fetchStats() {
            if (!userId) return;
            
            try {
                // Get weekly data for top artists/songs
                const today = new Date().toISOString().split("T")[0];
                const weeklyData = await getListeningDataForWeek(userId, today);
                
                // Get all-time listening data
                const { rawData } = await getListeningData(userId);
                
                // Calculate total stats
                let totalMinutes = 0;
                const uniqueSongs = new Set();
                
                rawData.forEach(entry => {
                    totalMinutes += entry.duration_ms / 60000;
                    uniqueSongs.add(`${entry.track_id || entry.date}`); // Use track_id or fallback to date
                });
                
                // Process weekly data for top artists and songs
                const songCounts = {};
                const artistCounts = {};
                let weeklyMinutes = 0;
                
                weeklyData.forEach(({ songName, artistName, songId, image, duration }) => {
                    // Add duration to weekly minutes
                    weeklyMinutes += duration / 60000;
                    
                    // Track song plays
                    if (!songCounts[songName]) {
                        songCounts[songName] = { count: 0, image, artist: artistName, id: songId };
                    }
                    songCounts[songName].count += 1;
                    
                    // Track artist plays
                    artistCounts[artistName] = (artistCounts[artistName] || 0) + 1;
                });
                
                // Get top 5 songs
                const topSongs = Object.entries(songCounts)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 3)
                    .map(([song, { count, image, artist }]) => ({ song, count, image, artist }));
                
                // Get top 5 artists
                const topArtists = Object.entries(artistCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([artist, count]) => ({ artist, count }));
                
                setStatsData({
                    topArtists,
                    topSongs,
                    weeklyTotal: Math.round(weeklyMinutes),
                    totalMinutes: Math.round(totalMinutes),
                    totalSongs: uniqueSongs.size
                });
                
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        }
        
        fetchStats();
    }, [userId]);

    if (loading) return (
        <div className="profile-container">
            <div className="profile-loading">
                <p>Loading profile...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="profile-container">
            <div className="profile-error">
                <p>{error}</p>
            </div>
        </div>
    );

    return (
        <div className="profile-container">
            {user && (
                <>
                    <div className="profile-header">
                        <div className="profile-image-container">
                            <img src={user.profile_pic_url} alt="Profile" className="profile-image" />
                        </div>
                        
                        <div className="profile-info">
                            <h1 className="profile-name">{user.display_name || user.name}</h1>
                            
                            <div className="profile-member-info">
                                <span className="spotify-text">Spotify</span>
                                <span className="separator">•</span>
                                <span>Music Enthusiast</span>
                            </div>
                            
                            <div className="profile-stats">
                                <div className="stat-item">
                                    <span className="stat-value">{statsData.totalMinutes || 0}</span>
                                    <span className="stat-label">Total Minutes</span>
                                </div>
                                
                                <div className="stat-item">
                                    <span className="stat-value">{statsData.totalSongs || 0}</span>
                                    <span className="stat-label">Songs Tracked</span>
                                </div>
                                
                                <div className="stat-item">
                                    <span className="stat-value">{statsData.weeklyTotal || 0}</span>
                                    <span className="stat-label">This Week</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="profile-stats-sections">
                        <div className="stats-section">
                            <h2>Top Artists This Week</h2>
                            <div className="stats-list">
                                {statsData.topArtists && statsData.topArtists.length > 0 ? (
                                    <ol className="top-list">
                                        {statsData.topArtists.map((item, index) => (
                                            <li key={index} className="top-list-item">
                                                <span className="artist-name">{item.artist}</span>
                                                <span className="play-count">{item.count} plays</span>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="loading-text">
                                        {statsData.topArtists === null ? "Loading artists..." : "No artists found"}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="stats-section">
                            <h2>Top Songs This Week</h2>
                            <div className="stats-list">
                                {statsData.topSongs && statsData.topSongs.length > 0 ? (
                                    <ol className="top-list songs-list">
                                        {statsData.topSongs.map((song, index) => (
                                            <li key={index} className="song-item">
                                                {song.image ? (
                                                    <img 
                                                        src={song.image} 
                                                        alt={song.song} 
                                                        className="song-image" 
                                                    />
                                                ) : (
                                                    <div className="song-image-placeholder"></div>
                                                )}
                                                <div className="song-details">
                                                    <span className="song-name">{song.song}</span>
                                                    <span className="song-artist">{song.artist}</span>
                                                    <span className="song-plays">{song.count} plays</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="loading-text">
                                        {statsData.topSongs === null ? "Loading songs..." : "No songs found"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <Shelf userId={userId} />
                </>
            )}
        </div>
    );
}

export default Profile;