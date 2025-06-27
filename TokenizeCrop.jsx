import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import africanFarmers from '../assets/african_farmers.jpg';

const monthOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function TokenizeCrop() {
  const [form, setForm] = useState({
    crop_type: '',
    crop_variety: '',
    planting_date: '',
    expected_harvest_month: '',
    token_count: '',
    price_per_token: '',
    expected_yield_unit: '',
    expected_total_yield: '',
    expected_roi: '',
    funding_deadline: '',
    organic_certified: false,
    farm_location: '',
    currency: 'USDT'
  });
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const farmerId = localStorage.getItem("farmer_id");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const farmerId = localStorage.getItem("farmer_id");
    if (!token || !farmerId) {
      // If not authenticated, redirect to home using React Router
      navigate("/");
      return;
    }

    // Fetch crops logic removed as per changes
  }, [navigate]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Create the crop
      const cropRes = await axios.post("http://127.0.0.1:8000/add_crop", {
        crop_name: form.crop_type,
        variety: form.crop_variety,
        planting_date: form.planting_date,
        expected_harvest_month: form.expected_harvest_month,
        farmer_id: parseInt(farmerId),
        farm_location: form.farm_location,
        organic_certified: form.organic_certified
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const crop_id = cropRes.data.crop_id || cropRes.data.id;
      // 2. Tokenize the crop
      await axios.post("http://127.0.0.1:8000/tokenize_crop", {
        crop_id,
        token_count: parseInt(form.token_count),
        price_per_token: parseInt(form.price_per_token),
        expected_yield_unit: form.expected_yield_unit,
        expected_total_yield: parseInt(form.expected_total_yield),
        expected_roi: parseFloat(form.expected_roi),
        funding_deadline: form.funding_deadline,
        currency: form.currency
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmitted(true);
      setForm({
        crop_type: '',
        crop_variety: '',
        planting_date: '',
        expected_harvest_month: '',
        token_count: '',
        price_per_token: '',
        expected_yield_unit: '',
        expected_total_yield: '',
        expected_roi: '',
        funding_deadline: '',
        organic_certified: false,
        farm_location: '',
        currency: 'USDT'
      });
    } catch (err) {
      console.error("Error tokenizing crop:", err);
      alert("Failed to tokenize crop.");
    }
  };

  const handleCreateAnother = () => {
    setSubmitted(false);
    setForm({
      crop_type: '',
      crop_variety: '',
      planting_date: '',
      expected_harvest_month: '',
      token_count: '',
      price_per_token: '',
      expected_yield_unit: '',
      expected_total_yield: '',
      expected_roi: '',
      funding_deadline: '',
      organic_certified: false,
      farm_location: '',
      currency: 'USDT'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 w-full h-full z-0">
        <img src={africanFarmers} alt="African Farmers" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
      <div className="flex justify-center items-center min-h-screen bg-transparent relative z-10">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">🌾 Tokenize a Crop</h2>
          {(!farmerId || !token) ? (
            <p className="text-red-600">Please log in as a farmer first.</p>
          ) : submitted ? (
            <div className="text-center">
              <div className="text-green-700 font-semibold mb-4">Token submitted! Please wait for approval.</div>
              <button onClick={handleCreateAnother} className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">Create Another Token</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 font-medium">Crop Type</label>
                <input name="crop_type" value={form.crop_type} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. Rice, Wheat" required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Crop Variety</label>
                <input name="crop_variety" value={form.crop_variety} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. Basmati, Arborio" required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Planting Date</label>
                <input name="planting_date" type="date" value={form.planting_date} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Expected Harvest Month</label>
                <select name="expected_harvest_month" value={form.expected_harvest_month} onChange={handleChange} className="w-full border p-2 rounded" required>
                  <option value="">Select month...</option>
                  {monthOptions.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Number of Tokens</label>
                <input name="token_count" type="number" value={form.token_count} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block mb-1">Price per Token (USDT)</label>
                <input name="price_per_token" type="number" value={form.price_per_token} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block mb-1">Expected Yield Unit (e.g., kg)</label>
                <input name="expected_yield_unit" value={form.expected_yield_unit} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block mb-1">Expected Total Yield</label>
                <input name="expected_total_yield" type="number" value={form.expected_total_yield} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block mb-1">Expected ROI (%)</label>
                <input name="expected_roi" type="number" value={form.expected_roi} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block mb-1">Funding Deadline</label>
                <input name="funding_deadline" type="date" value={form.funding_deadline} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>
              <div className="flex items-center">
                <input id="organic_certified" name="organic_certified" type="checkbox" checked={form.organic_certified} onChange={handleChange} className="mr-2" />
                <label htmlFor="organic_certified" className="font-medium">Organic Certified</label>
              </div>
              <div>
                <label className="block mb-1">Farm Location</label>
                <input name="farm_location" value={form.farm_location} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. North Field, GPS coordinates" required />
              </div>
              <button type="submit" className="col-span-1 md:col-span-2 w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">Create Tokens</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default TokenizeCrop;