import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import "../styles/ChatRoomPage.css";

const ChatroomPage = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return navigate("/login");

        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.user_id);

        const res = await api.get("/api/friends/");
        setFriends(res.data);
      } catch (err) {
        console.error("Error fetching chat data", err);
      }
    };
    init();
  }, [navigate]);

  const selectFriend = async (friend) => {
    if (!friend?.user?.id) {
      console.error("Selected friend does not have a user ID:", friend);
      return;
    }
  
    setSelectedFriend(friend);
    try {
      const res = await api.get(`/api/get-messages/${currentUserId}/${friend.user.id}/`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error loading messages", err);
      setMessages([]); // prevent crash if something fails
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedFriend) return;

    const payload = {
      sender: currentUserId,
      reciever: selectedFriend.user.id,
      message: newMessage.trim(),
    };

    try {
      const res = await api.post("/api/send-messages/", payload);
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  return (
    <div className="chatroom-container">
      {/* Left Panel */}
      <div className="chat-sidebar">
        <h2>ChatApp</h2>
        <input className="search-input" placeholder="Search your chat..." />

        {friends.map((friend) => (
          <div
            key={friend.id}
            className={`chat-friend ${
              selectedFriend?.id === friend.id ? "active" : ""
            }`}
            onClick={() => selectFriend(friend)}
          >
            <div className="chat-avatar" />
            <span>{friend.full_name}</span>
          </div>
        ))}
      </div>

      {/* Right Panel */}
      <div className="chat-window">
        <div className="chat-header">
          {selectedFriend ? selectedFriend.full_name : "Username"}
        </div>

        <div className="chat-body">
          {selectedFriend ? (
            messages && messages.length > 0 ? (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${
                    msg.sender === currentUserId ? "sent" : "received"
                  }`}
                >
                  {msg.message}
                </div>
              ))
            ) : (
              <div className="no-chat">No chats yet. Type a new message...</div>
            )
          ) : (
            <div className="select-user-message">Select a user to chat</div>
          )}
        </div>

        {selectedFriend && (
          <div className="chat-input-container">
            <input
              type="text"
              placeholder="Type your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatroomPage;
