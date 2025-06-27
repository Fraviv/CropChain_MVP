import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

function GlobalNavBar({ userRole, setUserRole, setShowLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.clear();
    if (setUserRole) setUserRole(null);
    if (setShowLogin) setShowLogin(false);
    navigate('/');
  };

  return (
    <nav className="bg-green-800 text-white px-4 py-3 flex items-center justify-between shadow">
      <div className="flex gap-4 items-center">
        <Link to="/" className="font-bold text-lg">CropChain</Link>
        {userRole === 'investor' && (
          <>
            <Link to="/tokens" className={location.pathname === '/tokens' ? 'underline' : ''}>Marketplace</Link>
            <Link to="/investments" className={location.pathname === '/investments' ? 'underline' : ''}>My Investments</Link>
          </>
        )}
        {userRole === 'farmer' && (
          <>
            <Link to="/register" className={location.pathname === '/register' ? 'underline' : ''}>Register</Link>
            <Link to="/tokenize-crop" className={location.pathname === '/tokenize-crop' ? 'underline' : ''}>Tokenize Crop</Link>
            <Link to="/farmer-dashboard" className={location.pathname === '/farmer-dashboard' ? 'underline' : ''}>Farmer Dashboard</Link>
          </>
        )}
      </div>
      {isLoggedIn && (
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
        >
          <FiLogOut className="text-xl" /> Log Out
        </button>
      )}
    </nav>
  );
}

export default GlobalNavBar; 