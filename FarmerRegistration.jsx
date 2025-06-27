import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import africanFarmers from '../assets/african_farmers.jpg';

function FarmerRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    region: '',
    farm_size_ha: '',
    contact: '',
    identity_document: null,
    address: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [showRegistrationRequired, setShowRegistrationRequired] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();
  const countryOptions = countryList().getData();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setProfile(null);
        setProfileLoading(false);
        navigate("/");
        return;
      }
      try {
        const res = await axios.get("http://127.0.0.1:8000/farmer_dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [submitted]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (selected) => {
    setFormData((prev) => ({ ...prev, country: selected ? selected.label : '' }));
  };

  const onDrop = (acceptedFiles) => {
    setFormData((prev) => ({ ...prev, identity_document: acceptedFiles[0] }));
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': [], 'image/*': [] } });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to register as a farmer.");
        return;
      }
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          data.append(key, value);
        }
      });
      await axios.post('http://127.0.0.1:8000/register_farmer', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSubmitted(true);
    } catch (err) {
      console.error("❌ Registration failed:", err);
      setError('Registration failed. Please try again.');
    }
  };

  // Only allow navigation to Tokenize Crop if verified
  const handleTokenizeCropNav = () => {
    if (profile && profile.registration_status !== 'verified') {
      setShowRegistrationRequired(true);
    } else {
      navigate("/tokenize-crop");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 w-full h-full z-0">
        <img src={africanFarmers} alt="African Farmers" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[60vh] mt-16 relative z-10">
        <div className="max-w-xl w-full p-6 bg-white shadow-md rounded">
          <h1 className="text-2xl font-bold mb-4 text-center">Farmer Registration</h1>
          {profileLoading ? (
            <p>Loading...</p>
          ) : profile ? (
            profile.registration_status === 'pending' ? (
              <p className="text-yellow-600 font-medium text-center">⏳ Registration submitted. Awaiting approval.</p>
            ) : profile.registration_status === 'verified' ? (
              <div className="text-green-700 text-center">
                <p className="font-medium mb-4 flex items-center justify-center gap-2"><span role="img" aria-label="check">✅</span> Your account has been verified!</p>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded"
                  onClick={() => navigate("/tokenize-crop")}
                >
                  Go to Tokenize Crop
                </button>
              </div>
            ) : profile.registration_status === 'rejected' ? (
              <p className="text-red-600 font-medium text-center">❌ Your registration was rejected. Please contact support or try again.</p>
            ) : null
          ) : submitted ? (
            <p className="text-yellow-600 font-medium text-center">⏳ Registration submitted. Awaiting approval.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium">Full Name</label>
                <input name="name" value={formData.name} onChange={handleChange} required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block font-medium">Country</label>
                <Select
                  options={countryOptions}
                  value={countryOptions.find(opt => opt.label === formData.country) || null}
                  onChange={handleCountryChange}
                  isClearable
                  placeholder="Select country..."
                  name="country"
                />
              </div>
              <div>
                <label className="block font-medium">Region</label>
                <input name="region" value={formData.region} onChange={handleChange} required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block font-medium">Address</label>
                <input name="address" value={formData.address} onChange={handleChange} required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block font-medium">Farm Size (ha)</label>
                <input name="farm_size_ha" type="number" step="0.1" value={formData.farm_size_ha} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block font-medium">Contact (optional)</label>
                <input name="contact" value={formData.contact} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block font-medium">Identity Document</label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded px-4 py-6 text-center cursor-pointer ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}>
                  <input {...getInputProps()} name="identity_document" />
                  {formData.identity_document ? (
                    <span className="text-green-700">{formData.identity_document.name}</span>
                  ) : (
                    <span className="text-gray-500">Drag & drop or click to upload (PDF, image)</span>
                  )}
                </div>
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Register</button>
              {error && <p className="text-red-600 mt-2">{error}</p>}
            </form>
          )}
        </div>
      </div>
      {showRegistrationRequired && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-center text-red-600">Registration Not Verified</h2>
            <p className="mb-4 text-center">Your registration must be verified before you can tokenize a crop.</p>
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-black"
              onClick={() => setShowRegistrationRequired(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmerRegistration;