// FarmerDashboard: Displays the farmer's profile and their tokenized crops.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import africanFarmers from '../assets/african_farmers.jpg';

function FarmerDashboard() {
  // State for farmer profile data
  const [farmer, setFarmer] = useState(null);
  // State for tokens belonging to the farmer
  const [tokens, setTokens] = useState([]);
  // State for loading farmer profile
  const [loading, setLoading] = useState(true);
  // State for loading tokens
  const [tokenLoading, setTokenLoading] = useState(true);
  // State for unauthorized access
  const [unauthorized, setUnauthorized] = useState(false);
  // State for session expiration
  const [sessionExpired, setSessionExpired] = useState(false);
  // State for showing registration popup
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(false);

  const navigate = useNavigate();

  // Fetch farmer profile and tokens on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const farmerId = localStorage.getItem("farmer_id");
    if (!token || !farmerId) {
      navigate("/");
      return;
    }
    axios.get("http://127.0.0.1:8000/farmer_dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setFarmer(res.data);
        setLoading(false);
        if (res.data.farmer_id) {
          localStorage.setItem("farmer_id", res.data.farmer_id);
          fetchTokens(res.data.farmer_id);
        } else {
          setTokens([]);
          setTokenLoading(false);
        }
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          setSessionExpired(true);
        } else {
          setUnauthorized(true);
        }
        setLoading(false);
        setTokenLoading(false);
      });

    // Fetch tokens for the farmer
    function fetchTokens(farmerId) {
      setTokenLoading(true);
      axios.get(`http://127.0.0.1:8000/tokens_by_farmer?farmer_id=${farmerId}`)
        .then(res => {
          setTokens(res.data);
          setTokenLoading(false);
        })
        .catch(err => {
          setTokenLoading(false);
        });
    }
  }, []);

  // Check if farmer profile exists
  const checkFarmerProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      await axios.get("http://127.0.0.1:8000/farmer_dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch {
      return false;
    }
  };

  // Handler for navigating to Tokenize Crop (if profile exists)
  const handleTokenizeCrop = async () => {
    const hasProfile = await checkFarmerProfile();
    if (hasProfile) {
      navigate("/tokenize-crop");
    } else {
      setShowRegistrationPopup(true);
    }
  };

  // Handler for "Tokenize Your First Crop" button
  const handleTokenizeFirstCrop = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowRegistrationPopup('not-registered');
      return;
    }
    try {
      const res = await axios.get("http://127.0.0.1:8000/farmer_dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.registration_status === 'verified') {
        navigate("/tokenize-crop");
      } else if (res.data.registration_status === 'pending') {
        setShowRegistrationPopup('pending');
      } else {
        setShowRegistrationPopup('not-registered');
      }
    } catch {
      setShowRegistrationPopup('not-registered');
    }
  };

  // Show session expired UI
  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <img src={africanFarmers} alt="African Farmers" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black opacity-40"></div>
        </div>
        <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 relative z-10">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-8 flex flex-col items-center">
            <h1 className="text-3xl font-extrabold text-green-700 mb-4 text-center">Session Expired</h1>
            <p className="text-red-600 mb-6 text-center">Session expired or unauthorized. Please log in again.</p>
            <button
              onClick={() => navigate("/")}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded shadow"
            >
              Go to Home
            </button>
          </div>
        </main>
        <footer className="bg-green-800 text-green-100 py-6 text-center text-sm mt-12">
          CropChain &copy; {new Date().getFullYear()} &mdash; Empowering Farmers, Connecting Investors.
        </footer>
      </div>
    );
  }

  // Show loading UI
  if (loading || tokenLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <img src={africanFarmers} alt="African Farmers" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black opacity-40"></div>
        </div>
        <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 relative z-10">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-8 flex flex-col items-center">
            <h1 className="text-3xl font-extrabold text-green-700 mb-4 text-center">Loading...</h1>
            <p className="text-gray-600 text-center">Loading your tokenized crops...</p>
          </div>
        </main>
        <footer className="bg-green-800 text-green-100 py-6 text-center text-sm mt-12">
          CropChain &copy; {new Date().getFullYear()} &mdash; Empowering Farmers, Connecting Investors.
        </footer>
      </div>
    );
  }

  // Show UI if no tokens are present
  if (!unauthorized && tokens.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <img src={africanFarmers} alt="African Farmers" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black opacity-40"></div>
        </div>
        <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 relative z-10">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-8 flex flex-col items-center mt-12">
            <h1 className="text-3xl font-extrabold text-black mb-4 text-center">🌿 Your Tokenized Crops</h1>
            <p className="text-gray-600 mb-6 text-center">You haven't tokenized any crops yet.</p>
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={() => navigate("/register")}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded shadow"
              >
                Complete Registration
              </button>
              <button
                onClick={handleTokenizeFirstCrop}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded shadow"
              >
                Tokenize Your First Crop
              </button>
            </div>
          </div>
        </main>
        <footer className="bg-green-800 text-green-100 py-6 text-center text-sm mt-12">
          CropChain &copy; {new Date().getFullYear()} &mdash; Empowering Farmers, Connecting Investors.
        </footer>
      </div>
    );
  }

  // Show main dashboard UI
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full z-0">
        <img src={africanFarmers} alt="African Farmers" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 relative z-10">
        <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-8 mt-12 flex flex-col items-center">
          <h1 className="text-3xl font-extrabold text-black mb-6 text-center">🌿 Your Tokenized Crops</h1>
          <div className="w-full flex flex-col items-center">
            {tokens.map(token => (
              <div key={token.id} className="bg-gray-50 p-4 rounded shadow flex flex-col w-full max-w-md mx-auto mb-6">
                <h3 className="text-xl font-bold mb-2 text-green-700 text-center">
                  {token.crop_name} – {token.price_per_token} {token.currency}
                </h3>
                <div className="mb-2 text-sm text-gray-700">
                  <div><strong>Variety:</strong> {token.crop_variety || 'N/A'}</div>
                  <div><strong>Planting Date:</strong> {token.planting_date ? new Date(token.planting_date).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Expected Harvest Month:</strong> {token.expected_harvest_month || 'N/A'}</div>
                  <div><strong>Expected Total Yield:</strong> {token.expected_total_yield} {token.expected_yield_unit}</div>
                  <div><strong>Expected ROI:</strong> {token.expected_roi !== undefined && token.expected_roi !== null ? Math.round(token.expected_roi) : 'N/A'}%</div>
                  <div><strong>Tokens Sold:</strong> {token.tokens_sold} / {token.token_count}</div>
                  <div><strong>Funding Deadline:</strong> {new Date(token.funding_deadline).toLocaleDateString()}</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${token.funding_percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Funding Progress: {token.funding_percentage}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer className="bg-green-800 text-green-100 py-6 text-center text-sm mt-12">
        CropChain &copy; {new Date().getFullYear()} &mdash; Empowering Farmers, Connecting Investors.
      </footer>
    </div>
  );
}

export default FarmerDashboard;