// import { useState } from "react";
// import { jwtDecode } from "jwt-decode";
// import { ACCESS_TOKEN } from "../constants";
// import api from "../api";

// const ChatBox = ({ userId }) => {
//   const [message, setMessage] = useState("");

//   const sendMessage = async () => {
//     try {
//       const token = localStorage.getItem(ACCESS_TOKEN);
//       if (!token) return;

//       const decodedToken = jwtDecode(token);
//       const senderId = decodedToken.user_id;

//       await api.post(
//         `/api/send-messages/`,
//         { sender: senderId, reciever: userId, message }
//       );
//       setMessage("");
//     } catch (error) {
//       console.error("Error sending message", error);
//     }
//   };

//   return (
//     <div>
//       <input value={message} onChange={(e) => setMessage(e.target.value)} className="border p-2 w-full" />
//       <button onClick={sendMessage} className="bg-blue-500 px-4 py-2 mt-2">Send</button>
//     </div>
//   );
// };

// export default ChatBox;


import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";
import api from "../api";

const ChatBox = ({ userId }) => {
  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) return;

      const decodedToken = jwtDecode(token);
      const senderId = decodedToken.user_id;

      await api.post(
        `/api/send-messages/`,
        { sender: senderId, reciever: userId, message }
      );
      setMessage("");
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  return (
    <div className="chat-input">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Type a message..."
      />
      <button
        onClick={sendMessage}
        className="bg-blue-500 text-white px-4 py-2 mt-2 rounded-lg hover:bg-blue-600 transition duration-300"
      >
        Send
      </button>
    </div>
  );
};

export default ChatBox;