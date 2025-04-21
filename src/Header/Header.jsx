import React, { useState, useEffect } from "react";
import "./Header.css";
import { Link } from "react-router-dom";
import getUserData from "../getUserData"; // Updated import to match your actual implementation
import LoginButton from "../Components/LoginButton";

const Header = ({ userId, setUserId, setUser }) => {
  const [user, setUserData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch user data when userId changes
  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        try {
          const userData = await getUserData(userId);
          setUserData(userData);
          setUser(userData); // Update user in parent component (App.js)
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
        setUser(null); // Reset user when logging out
      }
    };
    
    fetchUser();
  }, [userId, setUser]); // Add setUser as dependency

  const handleLogout = () => {
    localStorage.removeItem("userId"); // Clear userId from localStorage
    setUserId(null); // Update state in parent component (App.js) to null
    setIsDropdownOpen(false); // Close the dropdown menu if open
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleClickOutside = (e) => {
    if (e.target.closest('.dropdown') === null) {
      setIsDropdownOpen(false); // Close dropdown if clicked outside
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/settings">Settings</Link>

        {user ? (
          <div className="dropdown">
            <img
              className="profilePicture"
              src={user.profile_pic_url}
              alt="Profile"
              onClick={toggleDropdown}
            />
            {isDropdownOpen && (
              <div className="dropdownMenu">
                <Link to="/profile" onClick={() => setIsDropdownOpen(false)}>
                  Profile
                </Link>
                <button onClick={handleLogout}>Logout</button>
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
