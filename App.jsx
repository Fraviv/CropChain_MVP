// Main App component for CropChain. Handles global login state and routing.
import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import AppRoutes from './AppRoutes';

function App() {
  // State for showing login modal and tracking user role
  const [showLogin, setShowLogin] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'farmer', 'investor', or null
  const location = useLocation();

  // Persist login state across navigation and route changes using localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const investorId = localStorage.getItem('investor_id');
    const farmerId = localStorage.getItem('farmer_id');
    const userRoleLS = localStorage.getItem('userRole');
    if (token && investorId) {
      setUserRole('investor');
    } else if (token && farmerId) {
      setUserRole('farmer');
    } else if (userRoleLS) {
      setUserRole(userRoleLS);
    } else {
      setUserRole(null);
    }
  }, [showLogin, location.pathname]);

  // Render the main application routes
  return (
    <AppRoutes showLogin={showLogin} setShowLogin={setShowLogin} userRole={userRole} setUserRole={setUserRole} />
  );
}

export default App;