import "./LoginButton.css";

const LoginButton = ({ buttonText }) => {
  const handleLogin = async () => {
    window.location.href = "https://spotify-stats-app-production.up.railway.app/auth/login";
  };

  return (
    <button className="login-btn" onClick={handleLogin}>{buttonText}</button>
  );
};

export default LoginButton;
