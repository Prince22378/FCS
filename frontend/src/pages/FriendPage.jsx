import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

const FriendPage = () => {
  const navigate = useNavigate();
  const [friendList, setFriendList] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendsAndUsers = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return navigate("/login");

        const decoded = jwtDecode(token);
        const currentUserId = decoded.user_id;
        setUserId(currentUserId);

        const [friendsRes, usersRes] = await Promise.all([
          api.get("/api/friends/"),
          api.get("/api/all-users/"),
        ]);

        const friends = friendsRes.data; // friends are just profiles with id + full_name
        const allProfiles = usersRes.data;

        // Filter: remove yourself and existing friends from all users list
        const filteredUsers = allProfiles.filter(
          (profile) =>
            profile.user.id !== currentUserId &&
            !friends.some((f) => f.id === profile.id)
        );

        setFriendList(friends);
        setAllUsers(filteredUsers);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data", err);
        navigate("/login");
      }
    };

    fetchFriendsAndUsers();
  }, [navigate]);

  const handleSendFriendRequest = async (toUserId) => {
    try {
      await api.post("/api/friend-requests/send/", {
        to_user_id: toUserId,
      });
      alert("Friend request sent!");
      setAllUsers((prev) => prev.filter((u) => u.user.id !== toUserId));
    } catch (err) {
      console.error("Failed to send friend request", err);
      alert("Could not send request.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="friend-page">
      <h2>Your Friends</h2>
      {friendList.length === 0 ? (
        <p>No friends yet.</p>
      ) : (
        <ul className="friend-list">
          {friendList.map((friend) => (
            <li key={friend.id}>{friend.full_name}</li>
          ))}
        </ul>
      )}

      <hr />

      <h2>All Users</h2>
      {allUsers.length === 0 ? (
        <p>No users available to add.</p>
      ) : (
        <ul className="user-list">
          {allUsers.map((profile) => (
            <li key={profile.id} className="user-item">
              <span>{profile.full_name}</span>
              <button
                onClick={() => handleSendFriendRequest(profile.user.id)}
                className="send-request-button"
              >
                Send Friend Request
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendPage;
