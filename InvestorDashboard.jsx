import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import riceField from '../assets/rice_field.jpg';

function InvestorDashboard({ requireInvestorLogin }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      if (requireInvestorLogin) {
        requireInvestorLogin('/investments');
        return;
      }
      navigate("/");
      return;
    }
    axios.get("http://127.0.0.1:8000/my_contracts", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setContracts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("⛔ Error fetching contracts:", err);
        setUnauthorized(true);
        setLoading(false);
      });
  }, []);

  if (unauthorized) {
    if (requireInvestorLogin) {
      requireInvestorLogin('/investments');
      return null;
    }
    return (
      <p className="text-center text-red-600 mt-10">
        Unauthorized. Please log in as an investor first.
      </p>
    );
  }

  if (loading) {
    return <p className="text-center mt-10">Loading your investments...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 w-full h-full z-0">
        <img src={riceField} alt="Rice Field" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
      {/* Hero/Header Section */}
      <header className="bg-green-700 py-8 shadow-md mb-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">My CropChain Investments</h1>
          <p className="text-lg text-green-100 max-w-2xl">Track your active contracts and see the status of your investments in real agricultural projects. Each contract represents your stake in a farmer's future harvest.</p>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4">
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-600 mb-4 text-lg">You haven't invested in any tokens yet.</p>
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
              onClick={() => navigate('/tokens')}
            >
              Go to Marketplace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {contracts.map(contract => (
              <div key={contract.id} className="bg-white p-6 rounded-xl shadow-lg relative flex flex-col border border-gray-100 transition-transform transform hover:scale-105 hover:shadow-2xl" style={{ minHeight: 320 }}>
                <h3 className="text-xl font-bold mb-2 text-green-700">
                  {contract.crop_name || 'Crop'}
                  {contract.crop_variety ? ` – ${contract.crop_variety}` : ''}
                  {typeof contract.price_per_token !== 'undefined' ? ` – ${contract.price_per_token} USDT` : ''}
                </h3>
                <div className="grid grid-cols-1 gap-y-2 mb-2 text-sm text-gray-700">
                  <div><strong>Quantity:</strong> {contract.quantity}</div>
                  <div><strong>Total Value:</strong> {contract.total_value} USDT</div>
                  <div><strong>Expected ROI:</strong> {contract.expected_roi !== undefined && contract.expected_roi !== null ? Math.round(contract.expected_roi) : 'N/A'}%</div>
                  <div><strong>Expected Harvest:</strong> {contract.expected_harvest_month || 'N/A'}</div>
                  <div><strong>Delivery Type:</strong> {contract.delivery_type === 'money' ? 'Money (Cash payout)' : 'Product (Physical harvest)'}</div>
                  <div><strong>Payout Status:</strong> {contract.payout_status.charAt(0).toUpperCase() + contract.payout_status.slice(1)}</div>
                  <div><strong>Created:</strong> {contract.created_at ? new Date(contract.created_at).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Contract ID:</strong> {contract.id}</div>
                </div>
                <div className="flex-1"></div>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer className="bg-green-800 text-green-100 py-6 mt-12 text-center text-sm">
        CropChain &copy; {new Date().getFullYear()} &mdash; Empowering Farmers, Connecting Investors.
      </footer>
    </div>
  );
}

export default InvestorDashboard;
