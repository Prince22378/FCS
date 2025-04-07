import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/UserManagement.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [reportedUsers, setReportedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReportedProfile, setSelectedReportedProfile] = useState(null);
  const [showReportedProfileOverlay, setShowReportedProfileOverlay] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchReportedUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/admin-dashboard/");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("❌ Failed to load users", err);
    }
  };

  const fetchReportedUsers = async () => {
    try {
      const res = await api.get("/api/reported-users/");
      setReportedUsers(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching reported users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (userId) => {
    try {
      const res = await api.get(`/api/public-profile/${userId}/`);
      setSelectedReportedProfile(res.data);
      setShowReportedProfileOverlay(true);
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  };

  const handleResolveReport = async (userId) => {
    try {
      await api.post(`/api/admin/resolve-user/${userId}/`);
      alert("Report resolved");
      setShowReportedProfileOverlay(false);
      fetchReportedUsers();
    } catch (err) {
      alert("Failed to resolve report");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/api/admin/delete-user/${userId}/`);
      alert("User deleted successfully.");
      setShowReportedProfileOverlay(false);
      fetchReportedUsers();
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="sidebar">
        <ul>
          <li><a href="/admin-dashboard">Dashboard</a></li>
          <li><a href="/user_management">User Management</a></li>
          <li><a href="/reports_logs">Reports & Logs</a></li>
          <li><a href="/logout">Logout</a></li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <h2>User Management</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {/* 👥 All Users Section */}
              <div className="section">
                <h3>👥 All Users</h3>
                {users.length === 0 ? (
                  <p>No users found.</p>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="user-card">
                      <strong>{user.username}</strong> - {user.email}
                    </div>
                  ))
                )}
              </div>

              {/* 🚩 Reported Users Section */}
              <div className="section">
                <h3>🚩 Reported Users</h3>
                {reportedUsers && reportedUsers.length > 0 ? (
                  reportedUsers.map((report) => (
                    <div key={report.id} className="user-card reported">
                      <p><strong>Reporter:</strong> {report.reporter_username}</p>
                      <p><strong>Reported:</strong> {report.reported_username}</p>
                      <p><strong>Reason:</strong> {report.reason}</p>
                      {report.custom_reason && (
                        <p><strong>Custom:</strong> {report.custom_reason}</p>
                      )}
                      <small>{new Date(report.timestamp).toLocaleString()}</small>
                      <br />
                      <button className="btn view" onClick={() => handleViewProfile(report.reported_user)}>
                        👁 View Profile
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No reported users found.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Overlay */}
      {showReportedProfileOverlay && selectedReportedProfile && (
        <div className="overlay-backdrop">
          <div className="profile-overlay">
            <button className="close-btn" onClick={() => setShowReportedProfileOverlay(false)}>✖</button>
            <img
              src={`${api.defaults.baseURL}/api${selectedReportedProfile.image}`}
              alt="User"
              className="overlay-profile-pic"
            />
            <h3>{selectedReportedProfile.full_name}</h3>
            <p>{selectedReportedProfile.bio || "No bio available"}</p>

            <div className="report-actions">
              <button
                className="resolve-button"
                onClick={() => handleResolveReport(selectedReportedProfile.user.id)}
              >
                ✅ Resolve
              </button>

              <button
                className="delete-button"
                onClick={() => handleDeleteUser(selectedReportedProfile.user.id)}
                style={{ backgroundColor: "red", color: "white" }}
              >
                🗑 Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
