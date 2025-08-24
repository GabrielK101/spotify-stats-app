import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingIcon from "./Components/LoadingIcon";


const Callback = ({ setUserId }) => {
  const navigate = useNavigate();
  const [isProcessed, setIsProcessed] = useState(false); // Track if the code has been processed

  useEffect(() => {
    // Extract token from the hash (after the #)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const BACKEND = "http://localhost:8000";
    const redirect_uri = encodeURIComponent("http://localhost:5173/callback"); // Pass the redirect URL

    if (code && !isProcessed) { // Only process the code if it hasn't been processed yet
      setIsProcessed(true); // Mark the code as processed

      fetch(`${BACKEND}/auth/callback?code=${code}&redirect_uri=${redirect_uri}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log(data);
          const userId = data.user_id;
          setUserId(userId);
          localStorage.setItem("userId", userId); // Store the userId in localStorage
          navigate("/dashboard");
        })
        .catch((err) => {
          console.error("Error:", err);
          navigate("/"); // Redirect to login page on error
        });
    }
  }, [navigate, setUserId, isProcessed]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <LoadingIcon />
    </div>
  );
};

export default Callback;