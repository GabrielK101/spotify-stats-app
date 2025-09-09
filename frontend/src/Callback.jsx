import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingIcon from "./Components/LoadingIcon";


const Callback = ({ setUserId }) => {
  const navigate = useNavigate();
  const [isProcessed, setIsProcessed] = useState(false); // Track if the code has been processed

  useEffect(() => {
    if (isProcessed) return;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userId = urlParams.get("user_id");

    if (token) {
      console.log("Received token:", token);
      console.log("Received user_id:", userId);
      setIsProcessed(true); // mark it processed
      localStorage.setItem("token", token);
      if (userId) {
        localStorage.setItem("userId", userId);
        setUserId(userId);
      }
      navigate("/dashboard");
    } else {
      console.log("No token found");
      navigate("/");
    }
  }, [navigate, isProcessed]);


  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <LoadingIcon />
    </div>
  );
};

export default Callback;