import React, { useState, useEffect } from "react";
import "./Header.css";
import { Link } from "react-router-dom"; // If using React Router
import getUserData from "../getUserData";
import LoginButton from "../Components/LoginButton";

const Header = ({ userId }) => {
    const [user, setUser] = useState(null);

    // Fetch user data when userId changes
    useEffect(() => {
        const fetchUser = async () => {
            if (userId) {
                const userData = await getUserData(userId);
                setUser(userData);
            }
        };
        fetchUser();
    }, [userId]);

    return (
        <header>
            <nav>
                <Link to="/">Dashboard</Link>
                <Link to="/">Settings</Link>

                {user ? (
                    <img
                        className="profilePicture"
                        src={user.profile_pic_url}
                        alt="Profile"
                    />
                ) : (
                    <LoginButton />
                )}
            </nav>
        </header>
    );
};

export default Header;