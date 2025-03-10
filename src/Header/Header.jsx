import React, { useState, useEffect } from "react";
import "./Header.css";
import { Link } from "react-router-dom"; // If using React Router
import getUserData from "../getUserData";
import LoginButton from "../Components/LoginButton";

const Header = ({ userId, setUserId }) => {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch user data when userId changes
  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        const userData = await getUserData(userId);
        setUser(userData);
      } else {
        setUser(null); // Reset user when logging out
      }
    };
    fetchUser();
  }, [userId]); // Dependency on userId to refetch user data on logout

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
        <Link to="/">Dashboard</Link>
        <Link to="/">Settings</Link>

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
