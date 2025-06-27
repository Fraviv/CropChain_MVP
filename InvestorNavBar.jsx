import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

function InvestorNavBar({ setShowLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const handleInvestmentsClick = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLogin(true);
    } else {
      navigate('/investments');
    }
  };
  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.clear();
      navigate('/');
    }, 1000);
  };
  return (
    <nav className="bg-green-600 p-4 text-white flex gap-4 justify-between items-center">
      <div className="flex gap-4 items-center">
        <Link to="/" className={location.pathname === '/' ? 'font-bold underline' : ''}>Home</Link>
        <Link to="/tokens" className={location.pathname === '/tokens' ? 'font-bold underline' : ''}>Marketplace</Link>
        <Link to="/investments" className={location.pathname === '/investments' ? 'font-bold underline' : ''} onClick={handleInvestmentsClick}>My Investments</Link>
      </div>
      {localStorage.getItem('token') && (
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow min-w-[120px] justify-center"
          disabled={loggingOut}
        >
          {loggingOut ? 'Logging out...' : (<><FiLogOut className="text-xl" /> Log Out</>)}
        </button>
      )}
    </nav>
  );
}

export default InvestorNavBar;
