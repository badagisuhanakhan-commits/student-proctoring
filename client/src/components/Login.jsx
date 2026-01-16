import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        // Update UserContext
        setUser({ id: data.user.id, name: data.user.name, role: data.user.role, token: data.token });

        // Navigate to proper dashboard
        navigate(data.user.role === "faculty" ? "/faculty" : "/student");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ margin: "20px" }}>
      <h2>Login</h2>
      <input
        placeholder="Enter email"
        value={email}
        name="email"
        type="email"
        autoComplete="email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
