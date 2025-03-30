// import React, { useEffect, useState } from "react";
// import api from "../api";

// const AdminDashboard = () => {
//   const [data, setData] = useState({ users: [], messages: [], profiles: [] });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchAdminData();
//   }, []);

//   const fetchAdminData = () => {
//     api.get("/api/admin-dashboard/")
//       .then(response => {
//         setData(response.data);
//         setLoading(false);
//       })
//       .catch(error => {
//         console.error("Error fetching admin data", error);
//         setLoading(false);
//       });
//   };

//   const toggleVerification = (profileId) => {
//     api.post(`/api/toggle-verification/${profileId}/`)
//       .then(response => {
//         alert(`User verification updated to: ${response.data.verified ? "✅ Verified" : "❌ Not Verified"}`);
//         fetchAdminData(); // Refresh data after update
//       })
//       .catch(error => {
//         console.error("Error updating verification status", error);
//       });
//   };

//   if (loading) return <p>Loading...</p>;

//   return (
//     <div className="admin-container">
//       <h1>Admin Dashboard</h1>

//       <section>
//         <h2>Users</h2>
//         <ul>
//           {data.users.map(user => (
//             <li key={user.id}>
//               {user.username} - {user.email} - {user.is_superuser ? "Admin" : "User"}
//             </li>
//           ))}
//         </ul>
//       </section>

//       <section>
//         <h2>Profiles</h2>
//         <ul>
//           {data.profiles.map(profile => (
//             <li key={profile.id}>
//               {profile.full_name} - Verified: {profile.verified ? "✅" : "❌"}
//               <button onClick={() => toggleVerification(profile.id)} style={{ marginLeft: "10px" }}>
//                 {profile.verified ? "Unverify" : "Verify"}
//               </button>
//             </li>
//           ))}
//         </ul>
//       </section>
//     </div>
//   );
// };


import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const [data, setData] = useState({ users: [], messages: [], profiles: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = () => {
    api.get("/api/admin-dashboard/")
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching admin data", error);
        setLoading(false);
      });
  };

  const toggleVerification = (profileId) => {
    api
      .post(`/api/toggle-verification/${profileId}/`)
      .then((response) => {
        alert(
          `User verification updated to: ${
            response.data.verified ? "✅ Verified" : "❌ Not Verified"
          }`
        );
        fetchAdminData(); // Refresh data after update
      })
      .catch((error) => {
        console.error("Error updating verification status", error);
      });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="admin-container">
      <div className="sidebar">
        <ul>
          <li><a href="/admin_dashboard">Dashboard</a></li>
          <li><a href="/user_management">User Management</a></li>
          <li><a href="/admin_moderation">Moderation</a></li>
          <li><a href="/security_audits">Security Audits</a></li>
          <li><a href="/reports_logs">Reports & Logs</a></li>
          <li><a href="/">Logout</a></li>
        </ul>
      </div>

      <div className="main-content">
        <div className="container">
          <h2>Admin Dashboard</h2>

          {/* 🔷 Verification Requests Section */}
          <div className="section">
            <h3>🔍 Verification Requests</h3>
            <ul className="user-list">
              {data.profiles
                .filter(p => p.is_verification_pending && !p.verified)
                .map(profile => (
                  <li key={profile.id}>
                    <div>
                      <strong>{profile.full_name}</strong>
                      <br />
                      {profile.govt_document ? (
                        <a
                          href={`${api.defaults.baseURL}/api${profile.govt_document}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📎 View Document
                        </a>
                      ) : (
                        <small>No document uploaded</small>
                      )}
                    </div>
                    <button
                      className="btn approve"
                      onClick={() => toggleVerification(profile.id)}
                    >
                      ✅ Approve
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          {/* ✅ Verified Users */}
          <div className="section">
            <h3>✅ Verified Users</h3>
            <ul className="user-list">
              {data.profiles
                .filter((p) => p.verified)
                .map((profile) => (
                  <li key={profile.id}>
                    <div>
                      <strong>{profile.full_name}</strong>
                    </div>
                    <button
                      className="btn block"
                      onClick={() => toggleVerification(profile.id)}
                    >
                      ❌ Unverify
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          {/* 👥 All Users */}
          <div className="section">
            <h3>👥 All Users</h3>
            <ul className="user-list">
              {data.users.map((user) => (
                <li key={user.id}>
                  <div>
                    <strong>{user.username}</strong> - {user.email}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 💬 All Messages */}
          <div className="section">
            <h3>💬 Messages</h3>
            <ul className="user-list">
              {data.messages.map((msg) => (
                <li key={msg.id}>
                  <div>
                    <strong>{msg.sender_profile.full_name}</strong> ➜{" "}
                    <strong>{msg.reciever_profile.full_name}</strong>
                    <br />
                    <em>{msg.message}</em>
                    <br />
                    <small>{new Date(msg.date).toLocaleString()}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
