import React from 'react';
import LoginButton from '../Components/LoginButton';
import { HiChartBar, HiMusicNote, HiTrendingUp } from 'react-icons/hi';
import { MdOutlineMusicNote } from "react-icons/md";
import '../Styles/Landing.css';

const Landing = () => {
  return (
    <div className="landing">
      <div className="landing-container">
        <div className="landing-content">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-icon">
                <MdOutlineMusicNote />
            </div>
            
            <h1 className="hero-title">
                Welcome to Audiolyse
            </h1>
            
            <p className="hero-description">
              Discover your listening patterns, explore your favorite artists, and dive deep into your Spotify data with beautiful visualizations and insights.
            </p>
          </div>
          
          {/* Login Card */}
          <div className="login-card">
            <div className="card-header">
              <h2 className="card-title">Get Started</h2>
              <p className="card-description">
                Connect your Spotify account to unlock your music insights
              </p>
            </div>
            
            <div className="card-content">
              <LoginButton />
              
              <p className="login-footer">
                Start exploring your music journey today
              </p>
            </div>
          </div>
          
          {/* Features Preview */}
          <div className="features-preview">
            <div className="feature-item">
              <div className="feature-icon">
                <HiChartBar />
              </div>
              <h3>Analytics</h3>
              <p>Track your listening habits</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <HiMusicNote />
              </div>
              <h3>Insights</h3>
              <p>Discover your top artists</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <HiTrendingUp />
              </div>
              <h3>Trends</h3>
              <p>Visualize your music data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
