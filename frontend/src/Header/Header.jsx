import React, { useState, useEffect, useRef } from "react";
import "./Header.css";
import { Link, useNavigate } from "react-router-dom";
import getUserData from "../getUserData";
import LoginButton from "../Components/LoginButton";

const Header = ({ userId, setUserId, setUser }) => {
  const [user, setUserData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // Use ref for better click outside detection
  const navigate = useNavigate();

  // Fetch user data when userId changes
  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        try {
          const userData = await getUserData(userId);
          setUserData(userData);
          setUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
        setUser(null);
      }
    };
    
    fetchUser();
  }, [userId, setUser]);

  const handleLogout = () => {
    console.log("Logout button clicked");
    localStorage.removeItem("userId");
    setUserId(null);
    setIsDropdownOpen(false);
    navigate("/"); // Navigate to home page after logout
  };

  const handleProfileClick = () => {
    console.log("Profile button clicked");
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Improved click outside handler using ref
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <header>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/settings">Settings</Link>

        {user ? (
          <div className="dropdown" ref={dropdownRef}>
            <img
              className="profilePicture"
              src={user.profile_pic_url}
              alt="Profile"
              onClick={toggleDropdown}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleDropdown(e);
                }
              }}
            />
            {isDropdownOpen && (
              <div className="dropdownMenu">
                <button 
                  onClick={handleProfileClick}
                  className="dropdown-item"
                  type="button"
                >
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="dropdown-item"
                  type="button"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <LoginButton />
        )}
      </nav>
    </header>
  );
};

export default Header;