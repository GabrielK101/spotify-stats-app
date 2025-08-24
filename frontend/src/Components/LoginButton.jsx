import "./LoginButton.css";

const LoginButton = () => {
  const BACKEND = "http://localhost:8000";
  
  const handleLogin = async () => {
    const res = await fetch(`${BACKEND}/auth/login`);
    const { authorize_url } = await res.json();
    window.location.href = authorize_url;
  };

  return (
    <button className="login-btn" onClick={handleLogin}>Login</button>
  );
};

export default LoginButton;
