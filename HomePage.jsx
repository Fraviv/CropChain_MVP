import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi'; 
import axios from 'axios';
import logo from '../assets/CropChain_logo.png';
import vietFarmers from '../assets/viet_farmers.jpg';
import riceFarm from '../assets/rice_farm.jpg';
import FarmerLoginModal from './FarmerLoginModal';
import InvestorLoginModal from './InvestorLoginModal';

function HomePage({ setShowLogin, setUserRole }) {
  const [showFarmerLogin, setShowFarmerLogin] = useState(false);
  const [showFarmerDropdown, setShowFarmerDropdown] = useState(false);
  const [showFarmerLoginModal, setShowFarmerLoginModal] = useState(false);
  const [showInvestorOptions, setShowInvestorOptions] = useState(false);
  const [logoutMsg, setLogoutMsg] = useState(false);
  const [showRegistrationRequired, setShowRegistrationRequired] = useState(false);
  const [farmerRedirectTo, setFarmerRedirectTo] = useState(null);
  const [showFarmerInfo, setShowFarmerInfo] = useState(false);
  const [showInvestorInfo, setShowInvestorInfo] = useState(false);
  const navigate = useNavigate();
  const mainBoxRef = useRef(null);
  const [mainBoxBottom, setMainBoxBottom] = useState(null);

  useEffect(() => {
    if (mainBoxRef.current) {
      const rect = mainBoxRef.current.getBoundingClientRect();
      setMainBoxBottom(window.innerHeight - rect.bottom);
    }
  }, [showFarmerInfo, showInvestorInfo]);

  const handleFarmerLogin = async ({ email, password }) => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/farmer_login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/farmer-dashboard");
    } catch (err) {
      alert("Farmer login failed");
    }
  };

  const handleFarmerRegister = async ({ email, password }) => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/farmer_signup", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/farmer-dashboard");
    } catch (err) {
      alert("Farmer sign up failed");
    }
  };

  const handleInvestorLogin = async ({ email, password }) => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/investor_login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/investments");
    } catch (err) {
      alert("Investor login failed");
    }
  };

  const handleInvestorRegister = async ({ email, password }) => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/investor_signup", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/investments");
    } catch (err) {
      alert("Investor sign up failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 w-full h-full z-0 bg-gray-200">
        <img src={riceFarm} alt="Rice Farm" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
      {/* Nav Bar */}
      <nav className="bg-green-700 text-white px-4 py-3 flex items-center justify-between shadow relative z-10">
        <div className="flex items-center gap-4">
          <img src={logo} alt="CropChain Logo" className="h-10 w-auto mr-2" />
          <span className="font-bold text-xl tracking-tight">CropChain</span>
        </div>
        <button
          onClick={() => { localStorage.clear(); navigate('/'); }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
        >
          Log Out
        </button>
      </nav>
      {/* Main Content Card */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 relative z-10">
        <div className="w-full flex justify-center items-center relative">
          {/* Main Card */}
          <div id="mainBox" ref={mainBoxRef} className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-8 flex flex-col items-center relative z-10 mx-auto">
            <img src={logo} alt="CropChain Logo" className="w-48 mb-6" />
            <h1 className="text-3xl font-extrabold text-green-700 mb-2 text-center">Empowering Smallholder Farmers</h1>
            <p className="text-lg text-gray-700 text-center mb-8 max-w-xl">
              A decentralized platform turning future crop yields into tradable digital tokens. Invest in real agriculture, support communities, and share in the harvest.
            </p>
            <div className="flex flex-row justify-center items-center mt-4 gap-6 w-full">
              {/* Farmer Button + Info Icon (left) */}
              <div className="flex items-center">
                <button
                  type="button"
                  className="mr-2 text-green-700 hover:text-green-900 focus:outline-none"
                  aria-label="Farmer Info"
                  onClick={() => { setShowFarmerInfo((v) => !v); setShowInvestorInfo(false); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="white" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 7.5v.01M10 9.5v3" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowFarmerDropdown(prev => !prev)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded text-lg w-full shadow"
                  >
                    I'm a Farmer
                  </button>
                  {showFarmerDropdown && (
                    <div className="absolute top-full left-0 w-full bg-white border rounded shadow-md z-10">
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          const farmerId = localStorage.getItem('farmer_id');
                          if (token && farmerId) {
                            navigate('/register');
                          } else {
                            setUserRole('farmer');
                            localStorage.setItem("userRole", "farmer");
                            setShowFarmerDropdown(false);
                            setFarmerRedirectTo("/register");
                            setShowFarmerLoginModal(true);
                          }
                        }}
                      >
                        Register Farmer
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          const farmerId = localStorage.getItem('farmer_id');
                          if (token && farmerId) {
                            navigate('/tokenize-crop');
                          } else {
                            setUserRole('farmer');
                            localStorage.setItem("userRole", "farmer");
                            setShowFarmerDropdown(false);
                            setFarmerRedirectTo("/tokenize-crop");
                            setShowFarmerLoginModal(true);
                          }
                        }}
                      >
                        Tokenize Crop
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          const farmerId = localStorage.getItem('farmer_id');
                          if (token && farmerId) {
                            navigate('/farmer-dashboard');
                          } else {
                            setUserRole('farmer');
                            localStorage.setItem("userRole", "farmer");
                            setShowFarmerDropdown(false);
                            setFarmerRedirectTo("/farmer-dashboard");
                            setShowFarmerLoginModal(true);
                          }
                        }}
                      >
                        Farmer Dashboard
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Investor Button + Info Icon (right) */}
              <div className="flex items-center">
                <div className="relative">
                  <button
                    onClick={() => setShowInvestorOptions(prev => !prev)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded text-lg w-full shadow"
                  >
                    I'm an Investor
                  </button>
                  {showInvestorOptions && (
                    <div className="absolute top-full left-0 w-full bg-white border rounded shadow-md z-10">
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        onClick={() => {
                          setUserRole('investor'); 
                          localStorage.setItem("userRole", "investor");
                          navigate("/tokens");
                      }}
                      >
                        Marketplace
                      </button>
                      <button
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          const investorId = localStorage.getItem('investor_id');
                          if (token && investorId) {
                            navigate('/investments');
                          } else {
                            setUserRole('investor');
                            setShowInvestorOptions(false);
                            setShowLogin(true);
                          }
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        My Investments
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="ml-2 text-green-700 hover:text-green-900 focus:outline-none"
                  aria-label="Investor Info"
                  onClick={() => { setShowInvestorInfo((v) => !v); setShowFarmerInfo(false); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="white" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 7.5v.01M10 9.5v3" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* Farmer Info Popup (left of main box, floating, bottom-aligned) */}
          {showFarmerInfo && mainBoxBottom !== null && (
            <div className="hidden md:block fixed z-30 left-0 ml-8" style={{ bottom: mainBoxBottom, top: 'auto' }}>
              <div className="bg-white bg-opacity-95 rounded-xl shadow-lg p-6 w-72 max-h-[80vh] overflow-y-auto flex flex-col relative animate-fade-in">
                <button
                  className="absolute top-4 right-4 text-gray-600 hover:text-black"
                  onClick={() => setShowFarmerInfo(false)}
                  aria-label="Close Info"
                >
                  ✕
                </button>
                <h3 className="text-lg font-bold mb-2 text-green-700">Turn your future harvest into funding today.</h3>
                <p className="mb-4 text-gray-700">CropChain helps smallholder farmers access money upfront by turning future harvests into digital tokens investors can buy. This gives you access to early capital, helping you invest in your farm, improve productivity, and grow on your own terms — without relying on traditional loans.</p>
              </div>
            </div>
          )}
          {/* Investor Info Popup (right of main box, floating, bottom-aligned) */}
          {showInvestorInfo && mainBoxBottom !== null && (
            <div className="hidden md:block fixed z-30 right-0 mr-8" style={{ bottom: mainBoxBottom, top: 'auto' }}>
              <div className="bg-white bg-opacity-95 rounded-xl shadow-lg p-6 w-72 max-h-[80vh] overflow-y-auto flex flex-col relative animate-fade-in">
                <button
                  className="absolute top-4 right-4 text-gray-600 hover:text-black"
                  onClick={() => setShowInvestorInfo(false)}
                  aria-label="Close Info"
                >
                  ✕
                </button>
                <h3 className="text-lg font-bold mb-2 text-green-700">Invest in real-world agriculture.</h3>
                <p className="mb-4 text-gray-700">CropChain gives you access to high-impact investment opportunities by tokenizing future crop yields. Back verified farmers, diversify your portfolio, and earn returns based on real agricultural output — all while supporting global food production and rural development.</p>
              </div>
            </div>
          )}
        </div>
        {/* Mobile Info Panel (popup at bottom) */}
        {(showFarmerInfo || showInvestorInfo) && (
          <div className="flex md:hidden fixed left-0 right-0 bottom-0 z-40 justify-center items-end">
            <div className="bg-white bg-opacity-95 rounded-t-xl shadow-lg p-6 max-w-md w-full flex flex-col relative animate-fade-in max-h-[60vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-black"
                onClick={() => { setShowFarmerInfo(false); setShowInvestorInfo(false); }}
                aria-label="Close Info"
              >
                ✕
              </button>
              {showFarmerInfo && (
                <>
                  <h3 className="text-lg font-bold mb-2 text-green-700">Turn your future harvest into funding today.</h3>
                  <p className="mb-4 text-gray-700">CropChain helps smallholder farmers access money upfront by turning future harvests into digital tokens investors can buy. This gives you access to early capital, helping you invest in your farm, improve productivity, and grow on your own terms — without relying on traditional loans.</p>
                </>
              )}
              {showInvestorInfo && (
                <>
                  <h3 className="text-lg font-bold mb-2 text-green-700">Invest in real-world agriculture.</h3>
                  <p className="mb-4 text-gray-700">CropChain gives you access to high-impact investment opportunities by tokenizing future crop yields. Back verified farmers, diversify your portfolio, and earn returns based on real agricultural output — all while supporting global food production and rural development.</p>
                </>
              )}
            </div>
          </div>
        )}
        {showFarmerLoginModal && (
          <FarmerLoginModal
            onClose={() => setShowFarmerLoginModal(false)}
            redirectTo={farmerRedirectTo}
            onRequireRegistration={() => {
              setShowFarmerLoginModal(false);
              setShowRegistrationRequired(true);
            }}
          />
        )}
        {showRegistrationRequired && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
              <h2 className="text-xl font-semibold mb-4 text-center text-red-600">Registration Required</h2>
              <p className="mb-4 text-center">You must register as a farmer before you can tokenize a crop.</p>
              <button
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-2"
                onClick={() => {
                  setShowRegistrationRequired(false);
                  navigate("/register");
                }}
              >
                Go to Register Farmer
              </button>
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-black"
                onClick={() => setShowRegistrationRequired(false)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="bg-green-800 text-green-100 py-6 text-center text-sm mt-12">
        CropChain &copy; {new Date().getFullYear()} &mdash; Empowering Farmers, Connecting Investors.
      </footer>
    </div>
  );
}

export default HomePage;
