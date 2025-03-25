// // import React, { useEffect, useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { jwtDecode } from "jwt-decode";
// // import api from "../api";
// // import { ACCESS_TOKEN } from "../constants";
// // import "../styles/ChatRoomPage.css";

// // const ChatroomPage = () => {
// //   const navigate = useNavigate();
// //   const [friends, setFriends] = useState([]);
// //   const [currentUserId, setCurrentUserId] = useState(null);
// //   const [selectedFriend, setSelectedFriend] = useState(null);
// //   const [messages, setMessages] = useState([]);
// //   const [newMessage, setNewMessage] = useState("");

// //   useEffect(() => {
// //     const init = async () => {
// //       try {
// //         const token = localStorage.getItem(ACCESS_TOKEN);
// //         if (!token) return navigate("/login");

// //         const decoded = jwtDecode(token);
// //         setCurrentUserId(decoded.user_id);

// //         const res = await api.get("/api/friends/");
// //         setFriends(res.data);
// //       } catch (err) {
// //         console.error("Error fetching chat data", err);
// //       }
// //     };
// //     init();
// //   }, [navigate]);

// //   const selectFriend = async (friend) => {
// //     if (!friend?.user?.id) {
// //       console.error("Selected friend does not have a user ID:", friend);
// //       return;
// //     }
  
// //     setSelectedFriend(friend);
// //     try {
// //       const res = await api.get(`/api/get-messages/${currentUserId}/${friend.user.id}/`);
// //       setMessages(res.data || []);
// //     } catch (err) {
// //       console.error("Error loading messages", err);
// //       setMessages([]); // prevent crash if something fails
// //     }
// //   };

// //   const handleSend = async () => {
// //     if (!newMessage.trim() || !selectedFriend) return;

// //     const payload = {
// //       sender: currentUserId,
// //       reciever: selectedFriend.user.id,
// //       message: newMessage.trim(),
// //     };

// //     try {
// //       const res = await api.post("/api/send-messages/", payload);
// //       setMessages((prev) => [...prev, res.data]);
// //       setNewMessage("");
// //     } catch (err) {
// //       console.error("Error sending message", err);
// //     }
// //   };

// //   return (
// //     <div className="chatroom-container">
// //       {/* Left Panel */}
// //       <div className="chat-sidebar">
// //         <h2>ChatApp</h2>
// //         <input className="search-input" placeholder="Search your chat..." />

// //         {friends.map((friend) => (
// //           <div
// //             key={friend.id}
// //             className={`chat-friend ${
// //               selectedFriend?.id === friend.id ? "active" : ""
// //             }`}
// //             onClick={() => selectFriend(friend)}
// //           >
// //             <div className="chat-avatar" />
// //             <span>{friend.full_name}</span>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Right Panel */}
// //       <div className="chat-window">
// //         <div className="chat-header">
// //           {selectedFriend ? selectedFriend.full_name : "Username"}
// //         </div>

// //         <div className="chat-body">
// //           {selectedFriend ? (
// //             messages && messages.length > 0 ? (
// //               messages.map((msg, i) => (
// //                 <div
// //                   key={i}
// //                   className={`chat-message ${
// //                     msg.sender === currentUserId ? "sent" : "received"
// //                   }`}
// //                 >
// //                   {msg.message}
// //                 </div>
// //               ))
// //             ) : (
// //               <div className="no-chat">No chats yet. Type a new message...</div>
// //             )
// //           ) : (
// //             <div className="select-user-message">Select a user to chat</div>
// //           )}
// //         </div>

// //         {selectedFriend && (
// //           <div className="chat-input-container">
// //             <input
// //               type="text"
// //               placeholder="Type your message here..."
// //               value={newMessage}
// //               onChange={(e) => setNewMessage(e.target.value)}
// //               onKeyDown={(e) => e.key === "Enter" && handleSend()}
// //             />
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default ChatroomPage;




// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import api from "../api";
// import { ACCESS_TOKEN } from "../constants";
// import "../styles/ChatRoomPage.css";

// const ChatroomPage = () => {
//   const navigate = useNavigate();
//   const [friends, setFriends] = useState([]);
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [selectedFriend, setSelectedFriend] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [isTyping, setIsTyping] = useState(false);
//   const [friendTyping, setFriendTyping] = useState(false);
//   const [friendImages, setFriendImages] = useState({});


//   const formatTime = (dateString) => {
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date)) return "";
//       return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//     } catch {
//       return "";
//     }
//   };

//   useEffect(() => {
//     const token = localStorage.getItem(ACCESS_TOKEN);
//     if (!token) return navigate("/login");

//     try {
//       const decoded = jwtDecode(token);
//       setCurrentUserId(decoded.user_id);
//     } catch (err) {
//       console.error("Invalid token", err);
//       navigate("/login");
//     }
//   }, [navigate]);

//   useEffect(() => {
//     const fetchFriends = async () => {
//       try {
//         const res = await api.get("/api/friends/");
//         setFriends(res.data);
//       } catch (err) {
//         console.error("Error fetching friends", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (currentUserId) {
//       fetchFriends();
//     }
//   }, [currentUserId]);

//   const selectFriend = (friend) => {
//     if (!friend?.user?.id) return;
//     setSelectedFriend(friend);
//   };

//   useEffect(() => {
//     let intervalId;

//     const fetchMessages = async () => {
//       if (!selectedFriend || !currentUserId) return;

//       try {
//         const res = await api.get(
//           `/api/get-messages/${currentUserId}/${selectedFriend.user.id}/`
//         );

//         const newMessages = res.data || [];

//         // Simulate typing: if new message came from friend, show "typing..."
//         if (
//           messages.length > 0 &&
//           newMessages.length > messages.length
//         ) {
//           const latestMsg = newMessages[newMessages.length - 1];
//           if (String(latestMsg.sender) === String(selectedFriend.user.id)) {
//             setFriendTyping(true);
//             setTimeout(() => setFriendTyping(false), 1000);
//           }
//         }

//         setMessages(newMessages);
//       } catch (err) {
//         console.error("Error loading messages", err);
//       }
//     };

//     if (selectedFriend && currentUserId) {
//       fetchMessages();
//       intervalId = setInterval(fetchMessages, 500);
//     }

//     return () => clearInterval(intervalId);
//   }, [selectedFriend, currentUserId, messages]);

//   const handleSend = async () => {
//     if (!newMessage.trim() || !selectedFriend) return;

//     const payload = {
//       sender: currentUserId,
//       reciever: selectedFriend.user.id,
//       message: newMessage.trim(),
//     };

//     try {
//       const res = await api.post("/api/send-messages/", payload);
//       setMessages((prev) => [...prev, res.data]);
//       setNewMessage("");
//     } catch (err) {
//       console.error("Error sending message", err);
//     }
//   };

//   const handleTyping = (e) => {
//     setNewMessage(e.target.value);
//     setIsTyping(true);
//     clearTimeout(window.typingTimeout);
//     window.typingTimeout = setTimeout(() => setIsTyping(false), 1000);
//   };

//   useEffect(() => {
//     const chatBody = document.querySelector(".chat-body");
//     if (chatBody) {
//       chatBody.scrollTop = chatBody.scrollHeight;
//     }
//   }, [messages]);

//   if (loading || !currentUserId) {
//     return <div className="loading">Loading chat...</div>;
//   }

//   const fetchFriendImage = async (userId) => {
//     if (friendImages[userId]) return; // Already fetched, skip
//     try {
//       const res = await api.get(`/api/public-profile/${userId}/`);
//       const imagePath = res.data.image;
//       setFriendImages((prev) => ({ ...prev, [userId]: imagePath }));
//     } catch (err) {
//       console.error("Error fetching image for user", userId, err);
//     }
//   };
  

//   return (
//     <div className="chatroom-container">
//       <div className="chat-sidebar">
//         <h2>ChatApp</h2>
//         <input className="search-input" placeholder="Search your chat..." />
//         {friends.map((friend) => (
//           <div
//             key={friend.id}
//             className={`chat-friend ${selectedFriend?.id === friend.id ? "active" : ""}`}
//             onClick={() => selectFriend(friend)}
//           >
//             <img
//               className="chat-avatar"
//               src={
//                 friend.image
//                   ? `${api.defaults.baseURL}/api${friend.image}`
//                   : "/default-avatar.png"
//               }
//               alt={friend.full_name}
//               // onError={(e) => (e.target.src = "/default-avatar.png")}
//             />

//             <span>{friend.full_name}</span>
//           </div>
//         ))}
//       </div>

//       <div className="chat-window">
//         <div className="chat-header">
//           {selectedFriend && (
//             <>
//               <img
//                 className="chat-header-avatar"
//                 src={
//                   selectedFriend.image
//                     ? `${api.defaults.baseURL}/api${selectedFriend.image}`
//                     : "/default-avatar.png"
//                 }
//                 alt={selectedFriend.full_name}
//                 // onError={(e) => (e.target.src = "/default-avatar.png")}
//               />

//               <span>{selectedFriend.full_name}</span>
//             </>
//           )}
//         </div>

//         <div className="chat-body">
//           {selectedFriend ? (
//             messages.length > 0 ? (
//               <>
//                 {messages.map((msg, i) => {
//                   const isSentByMe =
//                     String(msg.sender?.id || msg.sender) === String(currentUserId);

//                   return (
//                     <div key={i} className={`chat-message ${isSentByMe ? "sent" : "received"}`}>
//                       <div>{msg.message}</div>
//                       <div className="chat-meta">
//                         <small className="message-timestamp">
//                           {formatTime(msg.date)}
//                         </small>
//                         {isSentByMe && msg.is_read && <span className="seen-check">✓✓</span>}
//                       </div>
//                     </div>
//                   );
//                 })}

//                 {/* ✅ Friend Typing Indicator */}
//                 {friendTyping && (
//                   <div className="typing-indicator">
//                     {selectedFriend?.full_name} is typing...
//                   </div>
//                 )}
//               </>
//             ) : (
//               <div className="no-chat">No chats yet. Type a new message...</div>
//             )
//           ) : (
//             <div className="select-user-message">Select a user to chat</div>
//           )}
//         </div>

//         {selectedFriend && (
//           <div className="chat-input-container">
//             <input
//               type="text"
//               placeholder="Type your message here..."
//               value={newMessage}
//               onChange={handleTyping}
//               onKeyDown={(e) => e.key === "Enter" && handleSend()}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatroomPage;


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
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [friendTyping, setFriendTyping] = useState(false);
  const [friendImages, setFriendImages] = useState({});


   // Fetch profile image by user ID
   const fetchFriendImage = async (userId) => {
    if (friendImages[userId]) return; // Already fetched
    try {
      const res = await api.get(`/api/public-profile/${userId}/`);
      const imagePath = res.data.image;
      setFriendImages((prev) => ({ ...prev, [userId]: imagePath }));
    } catch (err) {
      console.error("Error fetching image for user", userId, err);
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Decode token to get user ID
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return navigate("/login");

    try {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.user_id);
    } catch (err) {
      console.error("Invalid token", err);
      navigate("/login");
    }
  }, [navigate]);

  // Fetch friend list
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get("/api/friends/");
        setFriends(res.data);
      } catch (err) {
        console.error("Error fetching friends", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchFriends();
    }
  }, [currentUserId]);

 

  // Fetch images for all friends
  useEffect(() => {
    friends.forEach((friend) => {
      if (friend.user?.id) fetchFriendImage(friend.user.id);
    });
  }, [friends]);

  // When a friend is selected
  const selectFriend = (friend) => {
    if (!friend?.user?.id) return;
    setSelectedFriend(friend);
  };

  // Fetch messages
  useEffect(() => {
    let intervalId;

    const fetchMessages = async () => {
      if (!selectedFriend || !currentUserId) return;

      try {
        const res = await api.get(
          `/api/get-messages/${currentUserId}/${selectedFriend.user.id}/`
        );
        const newMessages = res.data || [];

        if (messages.length > 0 && newMessages.length > messages.length) {
          const latestMsg = newMessages[newMessages.length - 1];
          if (String(latestMsg.sender) === String(selectedFriend.user.id)) {
            setFriendTyping(true);
            setTimeout(() => setFriendTyping(false), 1000);
          }
        }

        setMessages(newMessages);
      } catch (err) {
        console.error("Error loading messages", err);
      }
    };

    if (selectedFriend && currentUserId) {
      fetchMessages();
      intervalId = setInterval(fetchMessages, 2000);
    }

    return () => clearInterval(intervalId);
  }, [selectedFriend, currentUserId]);

  

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    setIsTyping(true);
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => setIsTyping(false), 1000);
  };

  // Send message
  // const handleSend = async () => {
  //   if (!newMessage.trim() || !selectedFriend) return;

  //   const payload = {
  //     sender: currentUserId,
  //     reciever: selectedFriend.user.id,
  //     message: newMessage.trim(),
  //   };

  //   try {
  //     const res = await api.post("/api/send-messages/", payload);
  //     setMessages((prev) => [...prev, res.data]);
  //     setNewMessage("");
  //   } catch (err) {
  //     console.error("Error sending message", err);
  //   }
  // };

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
  
      // Delay fetching messages for a moment to avoid overwrite
      setTimeout(() => {
        fetchMessages();  // manually fetch after 800ms
      }, 800);
  
    } catch (err) {
      console.error("Error sending message", err);
    }
  };
  

  // Auto-scroll to latest message
  useEffect(() => {
    const chatBody = document.querySelector(".chat-body");
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }, [messages]);

  if (loading || !currentUserId) {
    return <div className="loading">Loading chat...</div>;
  }

  return (
    <div className="chatroom-container">
      <div className="chat-sidebar">
        <h2>ChatApp</h2>
        <input className="search-input" placeholder="Search your chat..." />
        {friends.map((friend) => (
          <div
            key={friend.id}
            className={`chat-friend ${selectedFriend?.id === friend.id ? "active" : ""}`}
            onClick={() => selectFriend(friend)}
          >
            <img
              className="chat-avatar"
              src={
                friend.user?.id && friendImages[friend.user.id]
                  ? `${api.defaults.baseURL}/api${friendImages[friend.user.id]}`
                  : "/default-avatar.png"
              }
              alt={friend.full_name}
            />
            <span>{friend.full_name}</span>
          </div>
        ))}
      </div>

      <div className="chat-window">
        <div className="chat-header">
          {selectedFriend && (
            <>
              <img
                className="chat-header-avatar"
                src={
                  selectedFriend.user?.id && friendImages[selectedFriend.user.id]
                    ? `${api.defaults.baseURL}/api${friendImages[selectedFriend.user.id]}`
                    : "/default-avatar.png"
                }
                alt={selectedFriend?.full_name}
              />
              <span>{selectedFriend.full_name}</span>
            </>
          )}
        </div>

        <div className="chat-body">
          {selectedFriend ? (
            messages.length > 0 ? (
              <>
                {messages.map((msg, i) => {
                  const isSentByMe =
                    String(msg.sender?.id || msg.sender) === String(currentUserId);

                  return (
                    <div key={i} className={`chat-message ${isSentByMe ? "sent" : "received"}`}>
                      <div>{msg.message}</div>
                      <div className="chat-meta">
                        <small className="message-timestamp">
                          {formatTime(msg.date)}
                        </small>
                        {isSentByMe && msg.is_read && <span className="seen-check">✓✓</span>}
                      </div>
                    </div>
                  );
                })}
                {friendTyping && (
                  <div className="typing-indicator">
                    {selectedFriend?.full_name} is typing...
                  </div>
                )}
              </>
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
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatroomPage;
