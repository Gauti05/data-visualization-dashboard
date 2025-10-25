import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";

function Navbar() {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <nav className="bg-indigo-600 dark:bg-gray-800 p-4 text-white flex justify-between items-center shadow-lg transition-colors">
      <div className="flex items-center space-x-4">
        <Link to="/" className="font-bold text-xl hover:text-indigo-200">
          Data Dashboard
        </Link>
        {token && (
          <>
            <Link to="/dashboard" className="hover:text-indigo-200">
              Dashboard
            </Link>
            <Link to="/profile" className="hover:text-indigo-200">
              Profile
            </Link>
          </>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        {token ? (
          <button
            onClick={handleLogout}
            className="bg-red-500 dark:bg-red-600 px-4 py-2 rounded hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        ) : (
          !isAuthPage && (
            <>
              <Link to="/login" className="hover:text-indigo-200">
                Login
              </Link>
              <Link to="/signup" className="hover:text-indigo-200">
                Signup
              </Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}

export default Navbar;

