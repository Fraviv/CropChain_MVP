import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import InvestmentModal from './InvestmentModal';
import InvestorLoginModal from './InvestorLoginModal';

function TokenList() {
  const [tokens, setTokens] = useState([]);
  const [filters, setFilters] = useState({
    crop_name: '',
    crop_variety: '',
    region: '',
    country: '',
    min_roi: '',
    deadline: '',
    created_after: '',
    status: '',
    farmer_id: '',
    funded_only: '',
    organic_only: false,
    price_per_token: '',
    expected_harvest_month: '',
    max_percentage_sold: '',
    min_yield_per_token: ''
  });
  const [cropTypeOptions, setCropTypeOptions] = useState([]);
  const [varietyOptions, setVarietyOptions] = useState([]);
  const [countryDropdownOptions, setCountryDropdownOptions] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    // Fetch all tokens to extract unique dropdown options for crop type, variety, and country
    axios.get("http://127.0.0.1:8000/tokens_available")
      .then(res => {
        setTokens(res.data);
        // Extract unique crop types, varieties, and countries from open tokens (to match what is shown)
        const openTokens = res.data.filter(t => t.status === 'open');
        setCropTypeOptions([...new Set(openTokens.map(t => t.crop_name))].map(val => ({ label: val, value: val })));
        setVarietyOptions([...new Set(openTokens.map(t => t.crop_variety))].map(val => ({ label: val, value: val })));
        setCountryDropdownOptions([...new Set(openTokens.map(t => t.country))].map(val => ({ label: val, value: val })));
      })
      .catch(err => console.error("Error fetching tokens for dropdowns:", err));
  }, []);

  const fetchTokens = () => {
    const url = new URL("http://127.0.0.1:8000/tokens_available");
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) {
        params.append(key, val);
      }
    });

    url.search = params.toString();

    axios.get(url.toString())
      .then((res) => setTokens(res.data))
      .catch((err) => console.error("Error fetching tokens:", err));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCountryChange = (selected) => {
    setFilters((prev) => ({ ...prev, country: selected ? selected.label : '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTokens();
  };

  // For dependent variety filter
  const getFilteredVarietyOptions = () => {
    if (!filters.crop_name) return varietyOptions;
    return varietyOptions.filter(opt =>
      tokens.find(t => t.crop_name === filters.crop_name && t.crop_variety === opt.value)
    );
  };

  // Calculate yield per token for filter and display
  const getYieldPerToken = (token) => {
    if (!token.expected_total_yield || !token.token_count) return null;
    return token.expected_total_yield / token.token_count;
  };

  // Clear filter handler
  const handleClearFilters = () => {
    setFilters({
      crop_name: '',
      crop_variety: '',
      region: '',
      country: '',
      min_roi: '',
      deadline: '',
      created_after: '',
      status: '',
      farmer_id: '',
      funded_only: '',
      organic_only: false,
      price_per_token: '',
      expected_harvest_month: '',
      max_percentage_sold: '',
      min_yield_per_token: ''
    });
  };

  const handleInvestClick = (token) => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      setShowLoginModal(true);
      return;
    }
    setSelectedToken(token);
    setShowInvestmentModal(true);
  };

  const handleInvestmentSuccess = (contract) => {
    // Refresh tokens to update availability
    fetchTokens();
    // Show success message
    alert(`Successfully invested in ${contract.quantity} tokens!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero/Header Section */}
      <header className="bg-green-700 py-8 shadow-md mb-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">CropChain Marketplace</h1>
          <p className="text-lg text-green-100 max-w-2xl">Browse and invest in tokenized crop opportunities from smallholder farmers worldwide. Use the filters below to discover projects that match your investment goals and risk profile.</p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4">
        {/* Filter Form Card */}
        <form onSubmit={handleSubmit} className="mb-8 bg-white rounded-xl shadow-lg p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border border-gray-100 relative">
          <h2 className="col-span-full text-xl font-semibold text-green-700 mb-2">Find Investment Opportunities</h2>
          <button type="button" onClick={handleClearFilters} className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded shadow text-sm">Clear Filters</button>
          <div>
            <label className="block mb-1 font-medium">Crop Type</label>
            <Select
              options={cropTypeOptions}
              value={cropTypeOptions.find(opt => opt.value === filters.crop_name) || null}
              onChange={selected => setFilters(f => ({ ...f, crop_name: selected ? selected.value : '', crop_variety: '' }))}
              isClearable
              placeholder="Select crop type..."
              name="crop_name"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Variety</label>
            <Select
              options={getFilteredVarietyOptions()}
              value={getFilteredVarietyOptions().find(opt => opt.value === filters.crop_variety) || null}
              onChange={selected => setFilters(f => ({ ...f, crop_variety: selected ? selected.value : '' }))}
              isClearable
              placeholder="Select variety..."
              name="crop_variety"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Country</label>
            <Select
              options={countryDropdownOptions}
              value={countryDropdownOptions.find(opt => opt.value === filters.country) || null}
              onChange={selected => setFilters(f => ({ ...f, country: selected ? selected.value : '' }))}
              isClearable
              placeholder="Select country..."
              name="country"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Min ROI (%)</label>
            <input type="number" name="min_roi" value={filters.min_roi} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="e.g. 10" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Max Price per Token</label>
            <input type="number" name="price_per_token" value={filters.price_per_token || ''} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="e.g. 100" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Min Yield per Token</label>
            <input type="number" name="min_yield_per_token" value={filters.min_yield_per_token || ''} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="e.g. 2" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Expected Harvest Month</label>
            <Select
              options={monthOptions.map(m => ({ label: m, value: m }))}
              value={filters.expected_harvest_month ? { label: filters.expected_harvest_month, value: filters.expected_harvest_month } : null}
              onChange={selected => setFilters(f => ({ ...f, expected_harvest_month: selected ? selected.value : '' }))}
              isClearable
              placeholder="Select month..."
              name="expected_harvest_month"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Funding Deadline Before</label>
            <input type="date" name="funding_deadline" value={filters.funding_deadline || ''} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Max % Tokens Sold</label>
            <input type="number" name="max_percentage_sold" value={filters.max_percentage_sold || ''} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="e.g. 80" />
          </div>
          <div className="flex items-center ml-4">
            <input type="checkbox" name="organic_only" checked={filters.organic_only} onChange={handleChange} className="mr-2" />
            <label>Organic Only</label>
          </div>
          <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded font-semibold hover:bg-green-700 transition col-span-full mt-2 shadow">Filter</button>
        </form>

        {/* Token Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {tokens.length === 0 ? (
            <p className="col-span-full text-center text-gray-500">No tokens found.</p>
          ) : (
            tokens
              .filter(token => {
                // Min yield per token filter
                if (filters.min_yield_per_token) {
                  const ypt = getYieldPerToken(token);
                  if (!ypt || ypt < Number(filters.min_yield_per_token)) return false;
                }
                // Max % tokens sold filter
                if (filters.max_percentage_sold) {
                  const percentSold = token.token_count ? (token.tokens_sold / token.token_count) * 100 : 0;
                  if (percentSold > Number(filters.max_percentage_sold)) return false;
                }
                // Harvest month filter
                if (filters.expected_harvest_month && token.expected_harvest_month !== filters.expected_harvest_month) return false;
                return true;
              })
              .map(token => (
              <div key={token.id} className="bg-white p-6 rounded-xl shadow-lg relative flex flex-col border border-gray-100 transition-transform transform hover:scale-105 hover:shadow-2xl" style={{ minHeight: 360 }}>
                <h3 className="text-xl font-bold mb-2 text-green-700">{token.crop_name} <span className="text-base font-medium text-gray-500">– {token.price_per_token} {token.currency}</span></h3>
                {/* Features in two columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-2 text-sm text-gray-700">
                  <div><strong>Variety:</strong> {token.crop_variety}</div>
                  <div><strong>Country:</strong> {token.country ? token.country.split(',')[0] : ''}</div>
                  <div><strong>Region:</strong> {token.region}</div>
                  <div><strong>Planting Date:</strong> {token.planting_date ? new Date(token.planting_date).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Expected Harvest:</strong> {token.expected_harvest_month || 'N/A'}</div>
                  <div><strong>Yield per Token:</strong> {getYieldPerToken(token) !== null ? getYieldPerToken(token).toFixed(2) + ' ' + (token.expected_yield_unit || '') : 'N/A'}</div>
                  <div><strong>ROI:</strong> {token.expected_roi !== undefined && token.expected_roi !== null ? Math.round(token.expected_roi) : 'N/A'}%</div>
                  <div><strong>Tokens Left:</strong> {token.tokens_left}</div>
                  <div><strong>Funding Deadline:</strong> {token.funding_deadline ? new Date(token.funding_deadline).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Status:</strong> {token.status}</div>
                  <div><strong>Organic:</strong> {token.organic_certified ? 'Yes' : 'No'}</div>
                </div>
                {/* Funding Progress Bar */}
                <div className="flex items-end mt-auto">
                  <div className="w-full bg-gray-200 rounded h-3 mb-2 mr-4" style={{ maxWidth: 'calc(100% - 110px)' }}>
                    <div
                      className="bg-green-500 h-3 rounded transition-all duration-300"
                      style={{ width: `${token.funding_percentage || 0}%` }}
                    ></div>
                  </div>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded shadow mb-1 transition min-w-[90px]"
                    onClick={() => handleInvestClick(token)}
                    disabled={token.tokens_left <= 0}
                  >
                    {token.tokens_left <= 0 ? 'Sold Out' : 'Invest'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Funding Progress: {token.funding_percentage || 0}%</p>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-green-800 text-green-100 py-6 mt-12 text-center text-sm">
        CropChain &copy; {new Date().getFullYear()} &mdash; Empowering Farmers, Connecting Investors.
      </footer>

      {/* Investment Modal */}
      {showInvestmentModal && selectedToken && (
        <InvestmentModal
          token={selectedToken}
          onClose={() => {
            setShowInvestmentModal(false);
            setSelectedToken(null);
          }}
          onSuccess={handleInvestmentSuccess}
        />
      )}
      {/* Login Modal */}
      {showLoginModal && (
        <InvestorLoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => setShowLoginModal(false)}
          onRegister={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default TokenList;