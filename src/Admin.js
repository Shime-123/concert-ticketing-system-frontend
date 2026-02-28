import { useState } from "react";
import AdminDashboard from "./AdminDashboard";

function Admin() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (password === process.env.REACT_APP_ADMIN_PASSWORD) {
      setAuthorized(true);
    } else {
      alert("Incorrect password!");
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <h1 className="text-3xl font-bold mb-4">Admin Login</h1>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-4 py-2 rounded mb-4 border w-64"
        />
        <button
          onClick={handleLogin}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Login
        </button>
      </div>
    );
  }

  return <AdminDashboard />;
}

export default Admin;
