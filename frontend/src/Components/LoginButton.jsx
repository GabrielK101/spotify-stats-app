import "./LoginButton.css";

const LoginButton = ({ buttonText }) => {
  const handleLogin = async () => {
    window.location.href = "http://localhost:8000/auth/login";
  };

  return (
    <button className="login-btn" onClick={handleLogin}>{buttonText}</button>
  );
};

export default LoginButton;
