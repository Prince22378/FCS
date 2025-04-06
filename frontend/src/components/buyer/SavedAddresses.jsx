import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/SavedAddresses.css';

const SavedAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    isDefault: false
  });

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await api.get('/api/buyer/addresses');
        setAddresses(response.data.addresses);
      } catch (error) {
        console.error('Error fetching addresses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (address) => {
    setIsEditing(address.id);
    setFormData({
      name: address.name,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phone: address.phone,
      isDefault: address.isDefault
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({
      name: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      isDefault: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/api/buyer/addresses/${isEditing}`, formData);
        setAddresses(prev => prev.map(addr => 
          addr.id === isEditing ? { ...addr, ...formData } : addr
        ));
      } else {
        const response = await api.post('/api/buyer/addresses', formData);
        setAddresses(prev => [...prev, response.data.address]);
      }
      handleCancel();
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/buyer/addresses/${id}`);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      await api.patch(`/api/buyer/addresses/${id}/set-default`);
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      })));
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  return (
    <div className="saved-addresses">
      <h2>Saved Addresses</h2>
      
      {loading ? (
        <div className="loading">Loading your addresses...</div>
      ) : (
        <>
          <div className="addresses-grid">
            {addresses.map(address => (
              <div 
                key={address.id} 
                className={`address-card ${address.isDefault ? 'default' : ''}`}
              >
                {address.isDefault && (
                  <div className="default-badge">Default</div>
                )}
                <h3>{address.name}</h3>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>{address.city}, {address.state} {address.zipCode}</p>
                <p>Phone: {address.phone}</p>
                
                <div className="address-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(address)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(address.id)}
                  >
                    Delete
                  </button>
                  {!address.isDefault && (
                    <button 
                      className="set-default-btn"
                      onClick={() => setDefaultAddress(address.id)}
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="address-form-container">
            <h3>{isEditing ? 'Edit Address' : 'Add New Address'}</h3>
            <form onSubmit={handleSubmit} className="address-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Address Line 1</label>
                <input
                  type="text"
                  name="line1"
                  value={formData.line1}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Address Line 2 (Optional)</label>
                <input
                  type="text"
                  name="line2"
                  value={formData.line2}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  name="isDefault"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                />
                <label htmlFor="isDefault">Set as default address</label>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {isEditing ? 'Update Address' : 'Save Address'}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default SavedAddresses;