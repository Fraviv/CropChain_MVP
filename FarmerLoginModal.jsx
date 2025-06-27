import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function FarmerLoginModal({ onClose, redirectTo, onRequireRegistration }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isSignup ? "/farmer_signup" : "/farmer_login";
    try {
      const res = await axios.post(`http://127.0.0.1:8000${endpoint}`, form);
      const { access_token, farmer } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("farmer_email", farmer?.email || form.email);
      localStorage.setItem("farmer_id", farmer?.id || "");
      localStorage.setItem("userRole", "farmer");
      onClose();
      // After login/signup, check if redirectTo is tokenize-crop and if user has a farmer profile
      if (redirectTo === "/tokenize-crop") {
        // Check if farmer profile exists
        const token = access_token;
        const farmerId = farmer?.id || localStorage.getItem("farmer_id");
        try {
          await axios.get(`http://127.0.0.1:8000/farmer_dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          navigate("/tokenize-crop");
        } catch (err) {
          if (onRequireRegistration) {
            onRequireRegistration();
          } else {
            alert("You must register as a farmer first.");
            navigate("/register");
          }
        }
      } else if (redirectTo) {
        navigate(redirectTo);
      } else if (isSignup) {
        navigate("/register");
      } else {
        navigate("/farmer-dashboard");
      }
    } catch (err) {
      alert("Authentication failed. See console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {isSignup ? 'Farmer Sign Up' : 'Farmer Login'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border p-2 rounded"
            required
            disabled={loading}
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full border p-2 rounded"
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Log In')}
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{' '}
          <button
            className="text-blue-600 underline"
            onClick={() => setIsSignup(!isSignup)}
            disabled={loading}
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </p>
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-black"
          onClick={onClose}
          disabled={loading}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default FarmerLoginModal;