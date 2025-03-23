import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";
import "../styles/Home.css";

// const Homepage = () => {
//   const [profile, setProfile] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       try {
//         const token = localStorage.getItem(ACCESS_TOKEN);
//         if (!token) return navigate("/login");

//         const decodedToken = jwtDecode(token);
//         const userId = decodedToken.user_id;  // Extract user_id

//         // Fetch profile data using /profile/${userId}/
//         const response = await api.get(`/api/profile/${userId}/`);
//         setProfile(response.data);
//       } catch (error) {
//         console.error("Error fetching user profile", error);
//         navigate("/login");
//       }
//     };
//     fetchUserProfile();
//   }, [navigate]);

//   const handleEditProfile = () => {
//     // Redirect to the profile edit page
//     navigate("/edit-profile");
//   };

//   return (
//     <div className="container mx-auto p-4">
//       {profile ? (
//         <div className="text-center">
//           <img
//             src={profile.image}
//             alt="Profile"
//             className="rounded-full w-32 h-32 mx-auto"
//           />
//           <h2 className="text-xl font-bold">{profile.full_name}</h2>
//           <p>{profile.bio}</p>
//           <button
//             onClick={handleEditProfile}
//             className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
//           >
//             Edit Profile
//           </button>
//         </div>
//       ) : (
//         <p>Loading...</p>
//       )}
//     </div>
//   );
// };

// export default Homepage;

// const BASE_URL = import.meta.env.VITE_API_URL

// const Homepage = () => {
//   const [profile, setProfile] = useState(null);
//   const [friendRequests, setFriendRequests] = useState([]);
//   const navigate = useNavigate();

//   // Fetch user profile and friend requests
//   useEffect(() => {
//     const token = localStorage.getItem(ACCESS_TOKEN);
//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     try {
//       const decodedToken = jwtDecode(token);
//       const userId = decodedToken.user_id;

//       const fetchProfile = async () => {
//         const res = await api.get(`/api/profile/${userId}/`);
//         setProfile(res.data);
//       };

//       const fetchFriendRequests = async () => {
//         const res = await api.get("/api/friend-requests/");
//         setFriendRequests(res.data);
//       };

//       fetchProfile();
//       fetchFriendRequests();
//     } catch (error) {
//       console.error("Error decoding token or fetching data:", error);
//       navigate("/login");
//     }
//   }, [navigate]);

//   // Handle editing profile
//   const handleEditProfile = () => {
//     navigate("/edit-profile");
//   };

//   // Handle logout
//   const handleLogout = () => {
//     localStorage.removeItem(ACCESS_TOKEN);
//     navigate("/login");
//   };

//   // Accept friend request
//   const handleAccept = async (requestId) => {
//     try {
//       await api.post(`/api/friend-requests/respond/${requestId}/`, { action: "accept" });
//       // Remove the request from local state
//       setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
//     } catch (err) {
//       console.error("Error accepting friend request:", err);
//     }
//   };

//   // Reject friend request
//   const handleReject = async (requestId) => {
//     try {
//       await api.post(`/api/friend-requests/respond/${requestId}/`, { action: "reject" });
//       // Remove the request from local state
//       setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
//     } catch (err) {
//       console.error("Error rejecting friend request:", err);
//     }
//   };

//   if (!profile) {
//     return <p>Loading...</p>;
//   }

//   return (
//     <div className="flex h-screen">
//       {/* Left Sidebar */}
//       <aside className="w-64 bg-gray-200 flex flex-col items-center py-4">
//         <img
//           src={`${BASE_URL}/api${profile.image}`}
//           alt="Profile"
//           className="rounded-full w-32 h-32 mb-2"
//         />
//         <h2 className="text-lg font-bold">{profile.full_name}</h2>
//         <p className="text-sm text-gray-700">{profile.bio}</p>

//         <button
//           onClick={handleEditProfile}
//           className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
//         >
//           Edit Profile
//         </button>

//         {/* Navigation buttons */}
//         <nav className="mt-8 flex flex-col space-y-2">
//           <button className="px-4 py-2 bg-gray-300 rounded">Friends</button>
//           <button className="px-4 py-2 bg-gray-300 rounded">Chatroom</button>
//           <button className="px-4 py-2 bg-gray-300 rounded">Marketplace</button>
//         </nav>

//         {/* Logout button at the bottom */}
//         <button
//           onClick={handleLogout}
//           className="mt-auto px-4 py-2 bg-red-500 text-white rounded"
//         >
//           Logout
//         </button>
//       </aside>

//       {/* Main content area */}
//       <main className="flex-1 bg-blue-100 p-4">
//         {/* Create Post box */}
//         <div className="bg-white p-4 rounded shadow">
//           <input
//             type="text"
//             placeholder="Create Post..."
//             className="w-full p-2 border border-gray-300 rounded"
//           />
//         </div>

//         {/* Example feed posts (placeholder) */}
//         <div className="mt-4">
//           <div className="bg-white p-4 rounded shadow mb-4">
//             <p>Sample Post #1</p>
//           </div>
//           <div className="bg-white p-4 rounded shadow">
//             <p>Sample Post #2</p>
//           </div>
//         </div>
//       </main>

//       {/* Right Sidebar (Friend Requests) */}
//       <aside className="w-64 bg-gray-100 p-4">
//         <h3 className="text-lg font-bold mb-2">Friend Requests</h3>
//         {friendRequests.length > 0 ? (
//           friendRequests.map((req) => (
//             <div
//               key={req.id}
//               className="flex items-center justify-between mb-2 bg-white p-2 rounded shadow"
//             >
//               <span>{req.from_user.username}</span>
//               <div>
//                 <button
//                   onClick={() => handleAccept(req.id)}
//                   className="px-2 py-1 bg-green-500 text-white rounded mr-2"
//                 >
//                   ✓
//                 </button>
//                 <button
//                   onClick={() => handleReject(req.id)}
//                   className="px-2 py-1 bg-red-500 text-white rounded"
//                 >
//                   X
//                 </button>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p>No friend requests</p>
//         )}
//       </aside>
//     </div>
//   );
// };

// export default Homepage;

const Homepage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return navigate("/login");

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user_id;

        const response = await api.get(`/api/profile/${userId}/`);
        setProfile(response.data);

        // Fetch friend requests after getting profile
        fetchFriendRequests();

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile", error);
        navigate("/login");
      }
    };

    const fetchFriendRequests = async () => {
      try {
        const response = await api.get("/api/friend-requests/");
        setFriendRequests(response.data); // Assuming response.data is a list of usernames or user objects
      } catch (error) {
        console.error("Error fetching friend requests", error);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleEditProfile = () => navigate("/edit-profile");
  const handleLogout = () => navigate("/logout");
  const handleFriendPage = () => navigate("/friends");
  const handleChatroomPage = () => navigate("/chat");

  const handleFriendRequestResponse = async (requestId, action) => {
    try {
      await api.post(`/api/friend-requests/respond/${requestId}/`, {
        action: action,
      });
      // After accepting/rejecting, refresh the list
      const response = await api.get("/api/friend-requests/");
      setFriendRequests(response.data);
    } catch (error) {
      console.error(`Failed to ${action} friend request:`, error);
    }
  };

  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="homepage">
      {/* Left Sidebar */}
      <div className="left-sidebar">
        <div className="profile-section">
          <div className="profile-circle">
            {profile?.image && (
              <img
                src={`${api.defaults.baseURL}/api${profile.image}`}
                alt="Profile"
              />
            )}
          </div>
        </div>

        <button onClick={handleEditProfile} className="edit-button">
          Edit Profile
        </button>
        <button className="sidebar-button" onClick={handleFriendPage}>
          Friends
        </button>
        <button
          className="sidebar-button" onClick={handleChatroomPage}>
          Chatroom
        </button>
        <button
          className="sidebar-button"
          onClick={() => alert("MarketPlace route not implemented!")}
        >
          MarketPlace
        </button>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {/* Center Content */}
      <div className="main-content">
        {/* Create Post */}
        <div className="create-post">
          <input
            type="text"
            placeholder="Create Post..."
            className="create-post-input"
          />
        </div>

        {/* Post 1 */}
        <div className="post-box">
          <div className="post-header">
            <img
              src="https://via.placeholder.com/40"
              alt="User Profile"
              className="post-profile-pic"
            />
            <span className="post-username">user_A1</span>
          </div>

          <img
            src="https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Post 1"
            className="post-image"
          />

          <div className="caption">This is a caption for post 1</div>
        </div>

        {/* Post 2 */}
        <div className="post-box">
          <div className="post-header">
            <img
              src="https://via.placeholder.com/40"
              alt="User Profile"
              className="post-profile-pic"
            />
            <span className="post-username">user_B2</span>
          </div>

          <img
            src="https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Post 2"
            className="post-image"
          />
          <div className="caption">This is the caption for post 2</div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        <h3>Friend Requests</h3>
        {friendRequests.length === 0 ? (
          <p>No pending friend requests</p>
        ) : (
          friendRequests.map((req, index) => (
            <div key={index} className="friend-request-item">
              <span>{req.from_user?.username || `User_${index + 1}`}</span>
              <div>
                <button
                  className="accept"
                  onClick={() => handleFriendRequestResponse(req.id, "accept")}
                >
                  &#10003;
                </button>
                <button
                  className="reject"
                  onClick={() => handleFriendRequestResponse(req.id, "reject")}
                >
                  &#10007;
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Homepage;
