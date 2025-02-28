import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";
import ChatBox from "../components/ChatBox";
import Message from "../components/Message";

const MessageDetail = () => {
  const { id: userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loggedInUserId, setLoggedInUserId] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return;

        const decodedToken = jwtDecode(token);
        setLoggedInUserId(decodedToken.user_id);

        const response = await api.get(`/api/get-messages/${decodedToken.user_id}/${userId}/`);
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages", error);
      }
    };
    fetchMessages();
  }, [userId]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Chat</h2>
      <div className="border p-4 h-96 overflow-y-scroll">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} loggedInUserId={loggedInUserId} />
        ))}
      </div>
      <ChatBox userId={userId} />
    </div>
  );
};

export default MessageDetail;