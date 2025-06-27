import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import HomePage from './components/HomePage';
import FarmerRegistration from './components/FarmerRegistration';
import TokenizeCrop from './components/TokenizeCrop';
import TokenList from './components/TokenList';
import InvestorDashboard from './components/InvestorDashboard';
import FarmerDashboard from './components/FarmerDashboard';
import InvestorLoginModal from './components/InvestorLoginModal';
import InvestorNavBar from './components/InvestorNavBar';

function AppRoutes({ showLogin, setShowLogin, userRole, setUserRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [redirectAfterLogin, setRedirectAfterLogin] = React.useState(null);

  // Only show farmer navbar on farmer-related pages, and investor navbar on investor pages
  const isFarmerPage = [
    '/register', '/tokenize-crop', '/farmer-dashboard'
  ].includes(location.pathname);
  const isInvestorPage = ['/tokens', '/investments'].includes(location.pathname);

  // Callback to require investor login and set redirect
  const requireInvestorLogin = (redirectPath = '/investments') => {
    setRedirectAfterLogin(redirectPath);
    setShowLogin(true);
  };

  // Stable login handlers
  const onInvestorLogin = React.useCallback(() => {
    setShowLogin(false);
    setUserRole("investor");
    navigate("/investments");
  }, [navigate, setUserRole]);

  const onInvestorRegister = React.useCallback(() => {
    setShowLogin(false);
    setUserRole("investor");
    navigate("/investments");
  }, [navigate, setUserRole]);

  React.useEffect(() => {
    if (!showLogin && redirectAfterLogin) {
      navigate(redirectAfterLogin);
      setRedirectAfterLogin(null);
    }
  }, [showLogin, redirectAfterLogin, navigate]);

  return (
    <>
      {isFarmerPage && (
        <nav className="bg-green-600 p-4 text-white flex gap-4 justify-between items-center">
          <div className="flex gap-4 items-center">
            <Link to="/" className={location.pathname === '/' ? 'font-bold underline' : ''}>Home</Link>
            <Link to="/register" className={location.pathname === '/register' ? 'font-bold underline' : ''}>Register Farmer</Link>
            <Link to="/tokenize-crop" className={location.pathname === '/tokenize-crop' ? 'font-bold underline' : ''}>Tokenize Crop</Link>
            <Link to="/farmer-dashboard" className={location.pathname === '/farmer-dashboard' ? 'font-bold underline' : ''}>Farmer Dashboard</Link>
          </div>
          {localStorage.getItem('token') && (
            <button
              onClick={() => { localStorage.clear(); navigate('/'); }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
            >
              <svg className="text-xl" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
              Log Out
            </button>
          )}
        </nav>
      )}
      {isInvestorPage && <InvestorNavBar setShowLogin={setShowLogin} />}

      {showLogin && (
        <InvestorLoginModal
          onClose={() => setShowLogin(false)}
          onLogin={onInvestorLogin}
          onRegister={onInvestorRegister}
        />
      )}

      <Routes>
        <Route path="/" element={
          <HomePage
            setShowLogin={setShowLogin}
            setUserRole={setUserRole}
          />
        } />
        <Route path="/register" element={<FarmerRegistration />} />
        <Route path="/tokenize-crop" element={<TokenizeCrop />} />
        <Route path="/tokens" element={<TokenList />} />
        <Route path="/investments" element={<InvestorDashboard requireInvestorLogin={requireInvestorLogin} />} />
        <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
      </Routes>
    </>
  );
}

export default AppRoutes;