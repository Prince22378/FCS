import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import "../styles/FriendPage.css"; // Assuming you're adding specific styles

const FriendPage = () => {
  const navigate = useNavigate(); // for navigation
  const [friendList, setFriendList] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [friendImages, setFriendImages] = useState({});
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const isFetchingRef = useRef(false); // 🆕 to stop multiple fetch calls

  const fetchFriendImage = async (userId) => {
    if (friendImages[userId]) return; // If the image already exists in the state, don't fetch it again
    try {
      const res = await api.get(`/api/public-profile/${userId}/`);
      setFriendImages((prev) => ({ ...prev, [userId]: res.data.image }));
    } catch (err) {
      console.error("Error fetching profile image:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return navigate("/login");

    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.user_id);
    } catch (err) {
      console.error("Invalid token", err);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchFriendsAndUsers = async () => {
      try {
        const friendsRes = await api.get("/api/friends/");
        const usersRes = await api.get("/api/all-users/");
        const friends = friendsRes.data;
        const allProfiles = usersRes.data;

        // Filter: Remove yourself and existing friends from the users list
        const filteredUsers = allProfiles.filter(
          (profile) => profile.user.id !== userId && !friends.some((f) => f.id === profile.id)
        );

        setFriendList(friends);
        setAllUsers(filteredUsers);

        // Fetch images for friends
        friends.forEach((friend) => {
          if (friend.user?.id) fetchFriendImage(friend.user.id);
        });
      } catch (err) {
        console.error("Error fetching friends or users:", err);
      }
    };

    if (userId) fetchFriendsAndUsers();
  }, [userId]);

  const handleSendFriendRequest = async (toUserId) => {
    try {
      await api.post("/api/friend-requests/send/", { to_user_id: toUserId });
      alert("Friend request sent!");
      setAllUsers((prev) => prev.filter((u) => u.user.id !== toUserId));
    } catch (err) {
      console.error("Failed to send friend request", err);
      alert("Could not send request.");
    }
  };

  // Redirect to the ChatroomPage when the "Message" button is clicked
  const handleMessageClick = (friend) => {
    navigate("/chat", { state: { friendId: friend.user.id } }); // Send the friend ID as state
  };

  // Filter friends and all users based on search query
  const filteredFriends = friendList.filter((friend) =>
    friend.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter((profile) =>
    profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="friend-page">
      <h2>Your Friends</h2>
      <input
        type="text"
        className="search-input"
        placeholder="Search friends..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)} // Update search query
      />
      <div className="friend-list-container">
        {filteredFriends.length === 0 ? (
          <p>No friends found.</p>
        ) : (
          filteredFriends.map((friend) => (
            <div key={friend.id} className="friend-card">
              <img
                className="friend-avatar"
                src={
                  friend.user?.id && friendImages[friend.user.id]
                    ? `${api.defaults.baseURL}/api${friendImages[friend.user.id]}`
                    : "/default-avatar.png"
                }
                alt={friend.full_name}
              />
              <div className="friend-details">
                <span>{friend.full_name}</span>
                <button
                  className="message-btn"
                  onClick={() => handleMessageClick(friend)} // On click, redirect to chat page
                >
                  Message
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <hr />

      <h2>All Users</h2>
      <input
        type="text"
        className="search-input"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)} // Update search query
      />
      <div className="user-list-container">
        {filteredUsers.length === 0 ? (
          <p>No users available to add.</p>
        ) : (
          filteredUsers.map((profile) => (
            <div key={profile.id} className="user-card">
              <img
                className="user-avatar"
                src={
                  profile.user?.id && friendImages[profile.user.id]
                    ? `${api.defaults.baseURL}/api${friendImages[profile.user.id]}`
                    : "/default-avatar.png"
                }
                alt={profile.full_name}
              />
              <div className="user-details">
                <span>{profile.full_name}</span>
                <button
                  className="add-btn"
                  onClick={() => handleSendFriendRequest(profile.user.id)}
                >
                  Add Friend
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendPage;
