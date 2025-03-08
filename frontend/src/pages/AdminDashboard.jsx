import React, { useEffect, useState } from "react";
import api from "../api";

const AdminDashboard = () => {
  const [data, setData] = useState({ users: [], messages: [], profiles: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = () => {
    api.get("/api/admin-dashboard/")
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching admin data", error);
        setLoading(false);
      });
  };

  const toggleVerification = (profileId) => {
    api.post(`/api/toggle-verification/${profileId}/`)
      .then(response => {
        alert(`User verification updated to: ${response.data.verified ? "✅ Verified" : "❌ Not Verified"}`);
        fetchAdminData(); // Refresh data after update
      })
      .catch(error => {
        console.error("Error updating verification status", error);
      });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>

      <section>
        <h2>Users</h2>
        <ul>
          {data.users.map(user => (
            <li key={user.id}>
              {user.username} - {user.email} - {user.is_superuser ? "Admin" : "User"}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Profiles</h2>
        <ul>
          {data.profiles.map(profile => (
            <li key={profile.id}>
              {profile.full_name} - Verified: {profile.verified ? "✅" : "❌"}
              <button onClick={() => toggleVerification(profile.id)} style={{ marginLeft: "10px" }}>
                {profile.verified ? "Unverify" : "Verify"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminDashboard;
