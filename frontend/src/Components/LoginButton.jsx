import "./LoginButton.css";

const LoginButton = ({ buttonText }) => {
  const handleLogin = async () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/login`;
  };

  return (
    <button className="login-btn" onClick={handleLogin}>{buttonText}</button>
  );
};

export default LoginButton;
