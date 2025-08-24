import "./LoginButton.css";

const LoginButton = () => {
  const handleLogin = async () => {
    window.location.href = "http://localhost:8000/auth/login";
  };

  return (
    <button className="login-btn" onClick={handleLogin}>Login</button>
  );
};

export default LoginButton;
