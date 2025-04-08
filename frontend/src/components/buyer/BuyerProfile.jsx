import React from 'react';
import '../../styles/BuyerProfile.css';

const BuyerProfile = () => {
  // Very minimal profile data
  const profile = {
    name: "John Doe",
    email: "john@example.com",
    joinedDate: "January 2023",
  };

  return (
    <div className="buyer-profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
      </div>
      
      <div className="profile-details">
        <div className="profile-avatar">
          <div className="avatar-placeholder">JD</div>
        </div>
        
        <div className="profile-info">
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{profile.name}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{profile.email}</span>
          </div>
          <div className="info-row">
            <span className="label">Member since:</span>
            <span className="value">{profile.joinedDate}</span>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="edit-btn">Edit Profile</button>
      </div>
    </div>
  );
};

export default BuyerProfile;