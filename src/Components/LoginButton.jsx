import { useState } from "react";
import "./LoginButton.css";

const CLIENT_ID = "51708b73fb5f4f78aa90ec2e5c7803ee"
const REDIRECT_URI = "http://localhost:5173/callback"

const LoginButton = () => {
  const handleLogin = () => {
    const scopes = "user-read-private user-read-recently-played";
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${encodeURIComponent(scopes)}`;
      window.location.href = authUrl;
    };
  
    return (
      <button className="login-btn" onClick={handleLogin}>Login</button>
    );
  };
  
  export default LoginButton;
