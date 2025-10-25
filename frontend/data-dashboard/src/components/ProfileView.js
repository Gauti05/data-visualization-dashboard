import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";

function ProfileView() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Not authenticated");
      return;
    }

    axios
      .get("http://localhost:8000/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setEmail(res.data.email);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile");
        setLoading(false);
      });
  }, [token]);

  if (loading) return <p className="text-center text-gray-700 dark:text-gray-300">Loading profile...</p>;
  if (error) return <p className="text-red-500 dark:text-red-400 text-center">{error}</p>;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md mx-auto border border-gray-200 dark:border-gray-700 transition-colors">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Profile</h2>
      <p className="text-gray-700 dark:text-gray-300">
        <span className="font-semibold">Email:</span> {email}
      </p>
    </div>
  );
}

export default ProfileView;
