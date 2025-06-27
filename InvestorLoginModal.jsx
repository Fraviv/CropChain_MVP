import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function InvestorLoginModal({ onClose, onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "/investor_login" : "/investor_signup";

    try {
      const res = await axios.post(`http://127.0.0.1:8000${endpoint}`, form);
      const { access_token, investor } = res.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("investor_email", investor?.email || form.email);
      localStorage.setItem("investor_id", investor?.id || "");
      localStorage.setItem("userRole", "investor");

      if (isLogin && onLogin) {
        onLogin();
      } else if (!isLogin && onRegister) {
        onRegister();
      } else if (onClose) {
        onClose();
      }
    } catch (err) {
      alert("Authentication failed. See console.");
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {isLogin ? 'Investor Login' : 'Investor Sign Up'}
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
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full border p-2 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            className="text-blue-600 underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>

        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

InvestorLoginModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onLogin: PropTypes.func,
  onRegister: PropTypes.func,
};

export default InvestorLoginModal;