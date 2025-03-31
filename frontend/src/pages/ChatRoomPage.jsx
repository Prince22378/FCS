// import React, { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import api from "../api";
// import { ACCESS_TOKEN } from "../constants";
// import "../styles/ChatRoomPage.css";
// import GroupChat from "./GroupChat"; 

// const ChatroomPage = () => {
//   const navigate = useNavigate();
//   const [friends, setFriends] = useState([]);
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [selectedFriend, setSelectedFriend] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [mediaFile, setMediaFile] = useState(null);
//   const [friendTyping, setFriendTyping] = useState(false);
//   const [friendImages, setFriendImages] = useState({});
//   const isFetchingRef = useRef(false); // 🆕 to stop multiple fetch calls
//   const [showGroupOverlay, setShowGroupOverlay] = useState(false);
//   const [groupName, setGroupName] = useState('');
//   const [groupBio, setGroupBio] = useState('');
//   const [selectedMembers, setSelectedMembers] = useState([]);
//   const [friendsList, setFriendsList] = useState([]);
//   const [currentStep, setCurrentStep] = useState(1);
//   const [selectedGroup, setSelectedGroup] = useState(null); // 🆕 Add this
//   const [groups, setGroups] = useState([]); 

//   const formatTime = (dateString) => {
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//     } catch {
//       return "";
//     }
//   };

//   const fetchFriendImage = async (userId) => {
//     if (friendImages[userId]) return;
//     try {
//       const res = await api.get(`/api/public-profile/${userId}/`);
//       setFriendImages((prev) => ({ ...prev, [userId]: res.data.image }));
//     } catch (err) {
//       console.error("Error fetching profile image:", err);
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
//       }
//     };

//     if (currentUserId) fetchFriends();
//   }, [currentUserId]);

//   useEffect(() => {
//     const fetchFriends = async () => {
//       try {
//         const res = await api.get("/api/friends/");
//         setFriendsList(res.data); // Correct the friendsList population
//       } catch (err) {
//         console.error("Error fetching friends", err);
//       }
//     };
  
//     if (showGroupOverlay) fetchFriends();  // Fetch friends only when overlay is shown
//   }, [showGroupOverlay]); // Ensure that this effect is triggered when the overlay is visible


//   // useEffect(() => {
//   //   const fetchFriendsAndGroups = async () => {
//   //     try {
//   //       const friendsRes = await api.get("/api/friends/");
//   //       setFriends(friendsRes.data);

//   //       // Fetch Groups
//   //       const groupsRes = await api.get("/api/groups/"); // Add an endpoint to fetch groups
//   //       setGroups(groupsRes.data);
//   //     } catch (err) {
//   //       console.error("Error fetching data", err);
//   //     }
//   //   };

//   //   if (currentUserId) fetchFriendsAndGroups();
//   // }, [currentUserId]);
  
//   useEffect(() => {
//     friends.forEach((f) => f.user?.id && fetchFriendImage(f.user.id));
//   }, [friends]);

//   const fetchMessages = async () => {
//     if (!selectedFriend || !currentUserId || isFetchingRef.current) return;

//     isFetchingRef.current = true;
//     try {
//       const res = await api.get(
//         `/api/get-messages/${currentUserId}/${selectedFriend.user.id}/`
//       );
//       const newMessages = res.data || [];

//       if (messages.length > 0 && newMessages.length > messages.length) {
//         const latestMsg = newMessages[newMessages.length - 1];
//         if (String(latestMsg.sender) === String(selectedFriend.user.id)) {
//           setFriendTyping(true);
//           setTimeout(() => setFriendTyping(false), 1000);
//         }
//       }

//       setMessages(newMessages);
//     } catch (err) {
//       console.error("Error fetching messages:", err);
//     } finally {
//       isFetchingRef.current = false;
//     }
//   };

//   useEffect(() => {
//     let isActive = true;

//     const loopFetch = async () => {
//       if (!isActive || !selectedFriend || !currentUserId) return;
//       await fetchMessages();
//       setTimeout(loopFetch, 2000);
//     };

//     loopFetch();
//     return () => {
//       isActive = false;
//     };
//   }, [selectedFriend, currentUserId]);

//   const handleSend = async () => {
//     if (!newMessage.trim() && !mediaFile) return;

//     const formData = new FormData();
//     formData.append("sender", currentUserId);
//     formData.append("reciever", selectedFriend.user.id);
//     formData.append("message", newMessage);
//     if (mediaFile) formData.append("media", mediaFile);

//     try {
//       const res = await api.post("/api/send-messages/", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });
//       setMessages((prev) => [...prev, res.data]);
//       setNewMessage("");
//       setMediaFile(null);
//     } catch (err) {
//       console.error("Error sending message", err);
//     }
//   };

//   const handleCreateGroup = async () => {
//     const groupData = {
//       name: groupName,
//       bio: groupBio,
//       members: [currentUserId, ...selectedMembers],  // Add the creator as a member
//     };
//     // console.log("Group Data to be sent:", groupData); 
//     try {
//       const response = await api.post("/api/create-group/", groupData);
//       // After creating the group, update the groups state to include the new group
//       setGroups((prevState) => [...prevState, response.data]);
//       setShowGroupOverlay(false);  // Close the overlay
//       // const response = await api.post("/api/create-group/", groupData);
//       // // console.log("Group created successfully:", response.data);
//       // setShowGroupOverlay(false);  // Close overlay after creating group
//       // // setGroupName('');  // Reset the form
//       // // setGroupBio('');
//       // // setSelectedMembers([]);
//       // // const groupsRes = await api.get("/api/groups/");
//       // setGroups(groupsRes.data);
//     } catch (error) {
//       console.error("Error creating group:", error);
//     }
//   };
  
//   const handleGroupSelect = (group) => {
//     setSelectedGroup(group);
//     setSelectedFriend(null); // clear friend selection when group is selected
//   };

//   const handleTyping = (e) => {
//     setNewMessage(e.target.value);
//   };

//   useEffect(() => {
//     const chatBody = document.querySelector(".chat-body");
//     if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
//   }, [messages]);

//   useEffect(() => {
//     const fetchGroups = async () => {
//       try {
//         const res = await api.get("/api/groups/");  // API call to fetch the user's groups
//         setGroups(res.data);  // Set the groups in the state
//       } catch (err) {
//         console.error("Error fetching groups:", err);
//       }
//     };
  
//     if (currentUserId) fetchGroups();  // Fetch groups when the user is logged in
//   }, [currentUserId]);  // This effect runs whenever the current user changes
  

//   if (!currentUserId) return <div>Loading...</div>;

//   // Determine if scroll is needed based on the number of friends or groups
//   const isScrollable = friends.length > 8; // This can be adjusted as per your requirement
//   const sidebarClass = isScrollable ? "scrollable" : "";

//   return (
//     <div className="chatroom-container">
//       <div className="chat-sidebar">
//         <h2>ChatApp</h2>
//         <input className="search-input" placeholder="Search chat..." />

//         {/* Sidebar Split - Friends Section */}
//         <div className={`sidebar-section ${sidebarClass}`}>
//           <h3>Friends</h3>
//           {friends.map((friend) => (
//             <div
//               key={friend.id}
//               className={`chat-friend ${selectedFriend?.id === friend.id ? "active" : ""}`}
//               onClick={() => setSelectedFriend(friend)}
//             >
//               <img
//                 className="chat-avatar"
//                 src={
//                   friend.user?.id && friendImages[friend.user.id]
//                     ? `${api.defaults.baseURL}/api${friendImages[friend.user.id]}`
//                     : "/default-avatar.png"
//                 }
//                 alt={friend.full_name}
//               />
//               <span>{friend.full_name}</span>
//             </div>
//           ))}
//         </div>

//         {/* Sidebar Split - Groups Section */}
//         <div className={`sidebar-section ${sidebarClass}`}>
//           <h3>Groups</h3>
//           {/* Display the Groups once the group functionality is added */}
//           {/* For now, this section can be left empty, or you can add a placeholder */}

//           <button onClick={() => setShowGroupOverlay(true)}>Create Group</button>
//           {groups.map((group) => (
//             <div
//               key={group.id}
//               className={`chat-group ${selectedGroup?.id === group.id ? "active" : ""}`}
//               onClick={() => handleGroupSelect(group)}
//             >
//               <span>{group.name}</span>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="chat-window">
//         <div className="chat-header">
//           {selectedFriend && (
//             <>
//               <img
//                 className="chat-header-avatar"
//                 src={
//                   selectedFriend.user?.id && friendImages[selectedFriend.user.id]
//                     ? `${api.defaults.baseURL}/api${friendImages[selectedFriend.user.id]}`
//                     : "/default-avatar.png"
//                 }
//                 alt={selectedFriend.full_name}
//               />
//               <span>{selectedFriend.full_name}</span>
//             </>
//           )}
//           {selectedGroup && (
//             <>
//               <span>{selectedGroup.name}</span>
//             </>
//           )}
//           {/* Display group chat */}
//           {selectedGroup && (
//             <GroupChat selectedGroup={selectedGroup} currentUserId={currentUserId} />
//           )}
//         </div>

//         <div className="chat-body">
//           {selectedFriend ? (
//             messages.length > 0 ? (
//               <>
//                 {messages.map((msg, i) => {
//                   const isMe = String(msg.sender?.id || msg.sender) === String(currentUserId);
//                   return (
//                     <div key={i} className={`chat-message ${isMe ? "sent" : "received"}`}>
//                       {msg.message && <div>{msg.message}</div>}

//                       {msg.media && (
//                         msg.media.endsWith(".mp4") ? (
//                           <video
//                             src={`${api.defaults.baseURL}/api${msg.media}`}
//                             controls
//                             className="chat-media-bubble"
//                           />
//                         ) : (
//                           <img
//                             src={`${api.defaults.baseURL}/api${msg.media}`}
//                             alt="media"
//                             className="chat-media-bubble"
//                           />
//                         )
//                       )}

//                       <div className="chat-meta">
//                         <small className="message-timestamp">{formatTime(msg.date)}</small>
//                         {isMe && msg.is_read && <span className="seen-check">✓✓</span>}
//                       </div>
//                     </div>
//                   );
//                 })}
//                 {friendTyping && (
//                   <div className="typing-indicator">{selectedFriend?.full_name} is typing...</div>
//                 )}
//               </>
//             ) : (
//               <div className="no-chat">No chats yet</div>
//             )
//           ) : (
//             <div className="select-user-message">Select a user to start chat</div>
//           )}
//         </div>

//         {showGroupOverlay && currentStep === 1 && (
//           <div className="overlay">
//             <div className="overlay-content">
//               <h2>Create Group</h2>
//               <input
//                 type="text"
//                 placeholder="Enter Group Name"
//                 value={groupName}
//                 onChange={(e) => setGroupName(e.target.value)}
//                 className="group-input"
//               />
//               <textarea
//                 placeholder="Enter Group Bio"
//                 value={groupBio}
//                 onChange={(e) => setGroupBio(e.target.value)}
//                 className="group-input"
//               />
//               <div className="overlay-actions">
//                 <button onClick={() => setShowGroupOverlay(false)}>Cancel</button>
//                 <button onClick={() => setCurrentStep(2)}>Next</button>
//               </div>
//             </div>
//           </div>
//         )}

//         {showGroupOverlay && currentStep === 2 && (
//           <div className="overlay">
//             <div className="overlay-content">
//               <h2>Select Members</h2>
//               <div className="friends-list">
//                 {friendsList.map((friend) => (
//                   <div key={friend.id} className="friend-item">
//                     <input
//                       type="checkbox"
//                       id={friend.id}
//                       onChange={() => {
//                         setSelectedMembers((prevState) =>
//                           prevState.includes(friend.id)
//                             ? prevState.filter((id) => id !== friend.id)
//                             : [...prevState, friend.id]
//                         );
//                       }}
//                     />
//                     <label htmlFor={friend.id}>{friend.full_name}</label>
//                   </div>
//                 ))}
//               </div>
//               <div className="overlay-actions">
//                 <button onClick={() => setCurrentStep(1)}>Back</button>
//                 <button onClick={handleCreateGroup}>Create Group</button>
//               </div>
//             </div>
//           </div>
//         )}

//         {selectedFriend && (
//           <div className="chat-input-container">
//             <input
//               type="text"
//               placeholder="Type a message..."
//               value={newMessage}
//               onChange={handleTyping}
//             />
//             <input
//               type="file"
//               accept="image/*,video/*"
//               onChange={(e) => setMediaFile(e.target.files[0])}
//             />
//             <button className="send-btn" onClick={handleSend}>Send</button>

//             {mediaFile && (
//               <div className="media-preview-wrapper">
//                 <div className="media-preview-inner">
//                   <button className="remove-media" onClick={() => setMediaFile(null)}>✕</button>
//                   {mediaFile.type.startsWith("image/") ? (
//                     <img src={URL.createObjectURL(mediaFile)} alt="preview" />
//                   ) : (
//                     <video src={URL.createObjectURL(mediaFile)} controls />
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatroomPage;



import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import "../styles/ChatRoomPage.css";
import GroupChat from "./GroupChat"; // ✅ Make sure this path is correct

const ChatroomPage = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null); // ✅ New
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [friendTyping, setFriendTyping] = useState(false);
  const [friendImages, setFriendImages] = useState({});
  const [showGroupOverlay, setShowGroupOverlay] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupBio, setGroupBio] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [groups, setGroups] = useState([]);
  const isFetchingRef = useRef(false);

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const fetchFriendImage = async (userId) => {
    if (friendImages[userId]) return;
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
      setCurrentUserId(decoded.user_id);
    } catch (err) {
      console.error("Invalid token", err);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUserId) {
      api.get("/api/friends/").then(res => {
        setFriends(res.data);
        setFriendsList(res.data);
      });
      api.get("/api/groups/").then(res => {
        setGroups(res.data);
      });
    }
  }, [currentUserId]);

  useEffect(() => {
    friends.forEach((f) => f.user?.id && fetchFriendImage(f.user.id));
  }, [friends]);

  const fetchMessages = async () => {
    if (!selectedFriend || !currentUserId || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await api.get(
        `/api/get-messages/${currentUserId}/${selectedFriend.user.id}/`
      );
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    let isActive = true;

    const loopFetch = async () => {
      if (!isActive || !selectedFriend || !currentUserId) return;
      await fetchMessages();
      setTimeout(loopFetch, 2000);
    };

    loopFetch();
    return () => {
      isActive = false;
    };
  }, [selectedFriend, currentUserId]);

  const handleSend = async () => {
    if (!newMessage.trim() && !mediaFile) return;

    const formData = new FormData();
    formData.append("sender", currentUserId);
    formData.append("reciever", selectedFriend.user.id);
    formData.append("message", newMessage);
    if (mediaFile) formData.append("media", mediaFile);

    try {
      const res = await api.post("/api/send-messages/", formData);
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      setMediaFile(null);
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
  };

  // const handleCreateGroup = async () => {
  //   try {
  //     const res = await api.post("/api/create-group/", {
  //       name: groupName,
  //       bio: groupBio,
  //       members: selectedMembers,
  //     });
  //     setGroups((prev) => [...prev, res.data]);
  //     setShowGroupOverlay(false);
  //     setCurrentStep(1);
  //     setGroupName("");
  //     setGroupBio("");
  //     setSelectedMembers([]);
  //   } catch (err) {
  //     console.error("Error creating group", err);
  //   }
  // };
  const handleCreateGroup = async () => {
    const formData = new FormData();
    formData.append("name", groupName);
    formData.append("bio", groupBio);
    selectedMembers.forEach(id => formData.append("members", id));
    if (mediaFile) formData.append("image", mediaFile);
  
    try {
      const res = await api.post("/api/create-group/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setGroups((prev) => [...prev, res.data]);
      setShowGroupOverlay(false);
      setCurrentStep(1);
      setGroupName("");
      setGroupBio("");
      setMediaFile(null);
      setSelectedMembers([]);
    } catch (err) {
      console.error("Error creating group", err);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedFriend(null); // clear private chat
  };

  return (
    <div className="chatroom-container">
      <div className="chat-sidebar">
        <h2>ChatApp</h2>
        <input className="search-input" placeholder="Search chat..." />

        <div className="sidebar-section">
          <h3>Friends</h3>
          {friends.map((friend) => (
            <div
              key={friend.id}
              className={`chat-friend ${selectedFriend?.id === friend.id ? "active" : ""}`}
              onClick={() => {
                setSelectedFriend(friend);
                setSelectedGroup(null);
              }}
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

        <div className="sidebar-section">
          <h3>Groups</h3>
          <button onClick={() => setShowGroupOverlay(true)}>Create Group</button>
          {groups.map((group) => (
            <div
              key={group.id}
              className={`chat-friend ${selectedGroup?.id === group.id ? "active" : ""}`}
              onClick={() => handleGroupSelect(group)}
            >
              <img
                className="chat-avatar"
                src={
                  group.image
                    ? `${api.defaults.baseURL}/api${group.image}`
                    : "/group-default.png"
                }
                alt={group.name}
              />
              <span>{group.name}</span>
            </div>
          ))}

        </div>
      </div>

      <div className="chat-window">
        <div className="chat-header">
          {selectedFriend && (
            <div className="chat-title">
              <img
                className="chat-header-avatar"
                src={
                  selectedFriend.user?.id && friendImages[selectedFriend.user.id]
                    ? `${api.defaults.baseURL}/api${friendImages[selectedFriend.user.id]}`
                    : "/default-avatar.png"
                }
                alt={selectedFriend.full_name}
              />
              <span>{selectedFriend.full_name}</span>
            </div>
          )}
          {selectedGroup && (
            <div className="chat-title">
              <img
                className="chat-header-avatar"
                src={selectedGroup.image ? `${api.defaults.baseURL}/api${selectedGroup.image}` : "/group-default.png"}
                alt={selectedGroup.name}
              />
              <span>{selectedGroup.name}</span>
            </div>
          )}
        </div>

        <div className="chat-body">
          {selectedGroup ? (
            <GroupChat selectedGroup={selectedGroup} currentUserId={currentUserId} />
          ) : selectedFriend ? (
            messages.map((msg, i) => {
              const isMe = String(msg.sender?.id || msg.sender) === String(currentUserId);
              return (
                <div key={i} className={`chat-message ${isMe ? "sent" : "received"}`}>
                  {msg.message && <div>{msg.message}</div>}
                  {msg.media && (
                    msg.media.endsWith(".mp4") ? (
                      <video src={`${api.defaults.baseURL}/api${msg.media}`} controls />
                    ) : (
                      <img src={`${api.defaults.baseURL}/api${msg.media}`} alt="media" />
                    )
                  )}
                  <div className="chat-meta">
                    <small>{formatTime(msg.date)}</small>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="select-user-message">Select a user or group to start chat</div>
          )}
        </div>

        {selectedFriend && !selectedGroup && (
          <div className="chat-input-container">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleTyping}
            />
            <input type="file" onChange={(e) => setMediaFile(e.target.files[0])} />
            <button onClick={handleSend}>Send</button>
          </div>
        )}
      </div>

      {showGroupOverlay && (
        <div className="overlay">
          {currentStep === 1 ? (
            <div className="overlay-content">
              <h2>Create Group</h2>
              <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <textarea
                placeholder="Group Bio"
                value={groupBio}
                onChange={(e) => setGroupBio(e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMediaFile(e.target.files[0])}
              />

              <button onClick={() => setCurrentStep(2)}>Next</button>
            </div>
          ) : (
            <div className="overlay-content">
              <h2>Select Members</h2>
              {friendsList.map((f) => (
                <div key={f.id}>
                  <input
                    type="checkbox"
                    id={`member-${f.id}`}
                    onChange={() => {
                      setSelectedMembers((prev) =>
                        prev.includes(f.id)
                          ? prev.filter((id) => id !== f.id)
                          : [...prev, f.id]
                      );
                    }}
                  />
                  <label htmlFor={`member-${f.id}`}>{f.full_name}</label>
                </div>
              ))}
              <button onClick={handleCreateGroup}>Create</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatroomPage;
