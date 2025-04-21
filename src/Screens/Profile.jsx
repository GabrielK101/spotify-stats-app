import React, { useEffect, useState } from "react";
import getUserData from "../getUserData";
import '../Styles/Profile.css';

function Profile({ userId }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) return (
        <div className="profile-container">
            <div className="profile-card">
                <p>Loading profile...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="profile-container">
            <div className="profile-card">
                <p className="error">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="profile-container">
            {user && (
                <div className="profile-card">
                    <img src={user.profile_pic_url} alt="Profile" className="profile-pic" />
                    <h2>{user.name}</h2>
                    <p>{user.bio || "No bio available"}</p>
                    
                    <div className="profile-metadata">
                        <div className="metadata-item">
                            <div className="value">{user.total_minutes || 0}</div>
                            <div className="label">Minutes Listened</div>
                        </div>
                        <div className="metadata-item">
                            <div className="value">{user.total_songs || 0}</div>
                            <div className="label">Songs Tracked</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;