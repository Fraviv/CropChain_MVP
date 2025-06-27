import React, { useState } from 'react';
import axios from 'axios';

function InvestmentModal({ token, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState('money');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maxQuantity = token.tokens_left || 0;
  const totalValue = quantity * token.price_per_token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (quantity > maxQuantity) {
      setError(`Cannot buy more than ${maxQuantity} tokens`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        setError('Please log in to invest');
        setLoading(false);
        return;
      }
      const response = await axios.post('http://127.0.0.1:8000/create_contract', {
        token_id: token.id,
        quantity: quantity,
        delivery_type: deliveryType
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      console.error('Investment error:', err);
      setError(err.response?.data?.detail || 'Failed to create investment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-black"
          onClick={onClose}
          disabled={loading}
        >
          ✕
        </button>
        
        <h2 className="text-xl font-semibold mb-4 text-center text-green-700">
          Invest in {token.crop_name}
        </h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <strong>Price per token:</strong> {token.price_per_token} {token.currency}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Available tokens:</strong> {maxQuantity}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Expected ROI:</strong> {Math.round(token.expected_roi || 0)}%
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Number of Tokens</label>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full border p-2 rounded"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Max: {maxQuantity} tokens
            </p>
          </div>

          <div>
            <label className="block mb-1 font-medium">Delivery Type</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deliveryType"
                  value="money"
                  checked={deliveryType === 'money'}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="mr-2"
                  disabled={loading}
                />
                <span>Money (Cash payout)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deliveryType"
                  value="product"
                  checked={deliveryType === 'product'}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="mr-2"
                  disabled={loading}
                />
                <span>Product (Physical harvest)</span>
              </label>
            </div>
          </div>

          {quantity > 0 && (
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <p className="text-sm font-medium text-green-800">
                Total Investment: {totalValue} {token.currency}
              </p>
              <p className="text-xs text-green-600">
                Expected return: {Math.round(totalValue * (1 + (token.expected_roi || 0) / 100))} {token.currency}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 rounded border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded font-semibold hover:bg-green-700 transition disabled:opacity-50"
            disabled={loading || quantity <= 0 || quantity > maxQuantity}
          >
            {loading ? 'Creating Investment...' : 'Invest Now'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default InvestmentModal; 