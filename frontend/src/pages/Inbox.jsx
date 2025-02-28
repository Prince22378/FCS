import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";
import UserListItem from "../components/UserListItem";

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return navigate("/login");

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user_id;

        const response = await api.get(`/api/my-messages/${userId}/`);
        setMessages(response.data);
        console.log("Inbox Messages:", response.data); // Debugging
      } catch (error) {
        console.error("Error fetching inbox", error);
      }
    };
    fetchInbox();
  }, []);

  return (
    <>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Inbox</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1 border-r p-4">
            {messages.length > 0 ? (
              messages.map((msg) => {
                const user =
                  msg.sender.id !== jwtDecode(localStorage.getItem(ACCESS_TOKEN)).user_id
                    ? msg.sender_profile
                    : msg.reciever_profile;
                return (
                  <div
                    key={msg.id}
                    onClick={() => navigate(`/message/${user.id}`)}
                    className={`p-2 cursor-pointer ${selectedUser?.id === user.id ? 'bg-gray-300' : ''}`}
                  >
                    <UserListItem user={user} message={msg.message} chatUserId={user.id} />
                  </div>
                );
              })
            ) : (
              <p>No messages found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Inbox;