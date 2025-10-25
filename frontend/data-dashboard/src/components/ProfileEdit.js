import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";

function ProfileEdit() {
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");
  const { token, login } = useContext(AuthContext); // Add login function

  const handleUpdate = async () => {
    setMessage("");
    
    if (!newEmail) {
      setMessage("Please enter a new email");
      return;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setMessage("Please enter a valid email address");
      return;
    }
    
    try {
      const res = await axios.put(
        "http://localhost:8000/me",
        { email: newEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
  
      if (res.data.new_token) {
        login(res.data.new_token);
      }
      
      setMessage(res.data.message || "Email updated successfully");
      setNewEmail("");
      
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      setMessage(err.response?.data?.detail || "Update failed");
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md mx-auto mt-6 border border-gray-200 dark:border-gray-700 transition-colors">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Update Email</h2>
      <input
        type="email"
        placeholder="New email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      />
      <button
        onClick={handleUpdate}
        disabled={!newEmail}
        className={`w-full py-3 rounded text-white font-semibold transition-colors ${
          !newEmail ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" : "bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600"
        }`}
      >
        Update Email
      </button>
      {message && (
        <p className={`mt-3 text-center ${message.includes('successfully') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default ProfileEdit;

