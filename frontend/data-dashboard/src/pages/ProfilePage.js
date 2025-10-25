import React, { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import ProfileView from "../components/ProfileView";
import ProfileEdit from "../components/ProfileEdit";
import PasswordChange from "../components/PassWordChange";

function ProfilePage() {
  const { token } = useContext(AuthContext);

  if (!token) return <p className="text-center p-4 text-gray-900 dark:text-white">Please login to view your profile.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-10 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h1 className="text-4xl font-extrabold text-center mb-12 text-indigo-700 dark:text-indigo-400">
        User Profile
      </h1>
      <ProfileView />
      <ProfileEdit />
      <PasswordChange />
    </div>
  );
}

export default ProfilePage;

