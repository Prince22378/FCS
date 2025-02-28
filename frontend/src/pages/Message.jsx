import { useState, useEffect } from "react";
import api from "../api"; // Import API instance
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";

function Message() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);

  // Fetch current user from JWT
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userData = {
          id: decoded.user_id,
          username: decoded.username,
          fullName: decoded.full_name,
          image: decoded.image,
        };
        setUser(userData);

        // Fetch messages for the logged-in user
        fetchMessages(userData.id);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // Fetch messages for the logged-in user
  const fetchMessages = async (userId) => {
    if (!userId) return;

    try {
      const response = await api.get(`/api/my-messages/${userId}/`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Handle search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter((message) =>
        message.sender.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [searchTerm, messages]);

  return (
    <div className="container mt-5">
      <h2>Messages</h2>
      <p>Welcome, {user?.fullName || "Guest"}!</p>

      {/* Search Input */}
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by sender"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Message List */}
      <ul className="list-group">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <li key={msg.id} className="list-group-item">
              <strong>{msg.sender}:</strong> {msg.content}
            </li>
          ))
        ) : (
          <li className="list-group-item text-muted">No messages found.</li>
        )}
      </ul>
    </div>
  );
}

export default Message;
