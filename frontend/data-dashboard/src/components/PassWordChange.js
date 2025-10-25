import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";

function PasswordChange() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const { token } = useContext(AuthContext);

  const handleChange = async () => {
    setMessage("");
    try {
      const res = await axios.put(
        "http://localhost:8000/me/password",
        {
          old_password: oldPassword,
          new_password: newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Password change failed");
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md mx-auto mt-6 border border-gray-200 dark:border-gray-700 transition-colors">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Change Password</h2>
      <input
        type="password"
        placeholder="Current password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      />
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      />
      <button
        onClick={handleChange}
        disabled={!oldPassword || !newPassword}
        className={`w-full py-3 rounded text-white font-semibold transition-colors ${
          !oldPassword || !newPassword ? "bg-gray-400 dark:bg-gray-600" : "bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600"
        }`}
      >
        Change Password
      </button>
      {message && <p className="mt-3 text-center text-gray-700 dark:text-gray-300">{message}</p>}
    </div>
  );
}

export default PasswordChange;

