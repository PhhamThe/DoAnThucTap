// src/components/Navbar.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

function Navbar() {
  const { logout } = useContext(AuthContext);
  return (
    <nav className="bg-gray-800 text-white py-4">
      <div className="container mx-auto flex space-x-4">
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        <Link to="/courses"  className="hover:underline">All Courses</Link>
        <Link to="/progress" className="hover:underline">Progress</Link>
        <button onClick={logout} className="ml-auto bg-red-600 hover:bg-red-700 px-3 py-1 rounded">
          Logout
        </button>
      </div>
    </nav>
  );
}
export default Navbar;
