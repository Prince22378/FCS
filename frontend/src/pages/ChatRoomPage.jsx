import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN, PRIVATE_KEY } from "../constants";
import { ec as EC } from "elliptic"; // Elliptic Curve Crypto
import CryptoJS from "crypto-js"; 
import "../styles/ChatRoomPage.css";  

const ec = new EC("p256"); // Using P-256 Curve

// import { ACCESS_TOKEN } from "../constants";
// import "../styles/ChatRoomPage.css";
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
  const [friendPublicKey, setFriendPublicKey] = useState(null);
  const [privateKeyHex, setPrivateKeyHex] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [decryptedMediaURLs, setDecryptedMediaURLs] = useState({});




  const isFetchingRef = useRef(false);


  // Convert HEX to Uint8Array
  const hexToUint8Array = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));

  // Convert Uint8Array to HEX
  const uint8ArrayToHex = (uint8Array) =>
    Array.from(uint8Array).map((b) => b.toString(16).padStart(2, "0")).join("");

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
    // Load stored private key
    const storedPrivateKey = localStorage.getItem(PRIVATE_KEY);
    if (storedPrivateKey) {
      setPrivateKeyHex(storedPrivateKey);
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

  useEffect(() => {
    const decryptAllMedia = async () => {
      for (const msg of messages) {
        if (msg.media && !decryptedMediaURLs[msg.id]) {
          try {
            const sharedSecret = ec.keyFromPublic(friendPublicKey, "hex")
              .getPublic()
              .mul(ec.keyFromPrivate(privateKeyHex, "hex").getPrivate())
              .encode("hex");
  
            const response = await fetch(`${api.defaults.baseURL}/api${msg.media}`);
            const encryptedBlob = await response.blob();
            const decryptedBlob = await decryptMediaFile(encryptedBlob, sharedSecret);
            const url = URL.createObjectURL(decryptedBlob);
  
            setDecryptedMediaURLs((prev) => ({ ...prev, [msg.id]: url }));
          } catch (err) {
            console.error(`Decryption failed for media in msg ${msg.id}`, err);
          }
        }
      }
    };
  
    decryptAllMedia();
  }, [messages, friendPublicKey, privateKeyHex]);
  
  useEffect(() => {
    if (!selectedFriend) return;
    const fetchPublicKey = async () => {
      try {
        const res = await api.get(`/api/public-profile/${selectedFriend.user.id}/`);
        setFriendPublicKey(res.data.public_key); // Public key in HEX format
      } catch (err) {
        console.error("Error fetching public key", err);
      }
    };
    fetchPublicKey();
  }, [selectedFriend]);

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

  // Encrypt Message
  const encryptMessage = (message, publicKeyHex) => {
    if (!publicKeyHex) return null;
    const key = ec.keyFromPublic(publicKeyHex, "hex");
    const msgHex = uint8ArrayToHex(new TextEncoder().encode(message));
    return key.getPublic().mul(new EC("p256").genKeyPair().priv).encode("hex", { compressed: true }) + msgHex;
  };

  // Decrypt Message
  const decryptMessage = (encryptedMessage) => {
    if (!privateKeyHex) return null;
    const key = ec.keyFromPrivate(privateKeyHex, "hex");
    const encryptedHex = encryptedMessage.substring(0, 66);
    const encryptedKey = ec.keyFromPublic(encryptedHex, "hex");
    const sharedSecret = encryptedKey.getPublic().mul(key.getPrivate());
    const decryptedBuffer = hexToUint8Array(encryptedMessage.substring(66));
    return new TextDecoder().decode(decryptedBuffer);
  };

  const encryptMediaFile = async (file, key) => {
    const arrayBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
    return new Blob([encrypted]);
  };
  
  const decryptMediaFile = async (blob, key) => {
    const encryptedText = await blob.text();
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    const decryptedWords = decrypted.words;
    const byteArray = new Uint8Array(decryptedWords.length * 4);
    for (let i = 0; i < decryptedWords.length; i++) {
      byteArray[i * 4] = (decryptedWords[i] >> 24) & 0xff;
      byteArray[i * 4 + 1] = (decryptedWords[i] >> 16) & 0xff;
      byteArray[i * 4 + 2] = (decryptedWords[i] >> 8) & 0xff;
      byteArray[i * 4 + 3] = decryptedWords[i] & 0xff;
    }
    return new Blob([byteArray]);
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !mediaFile) return;
  
    const formData = new FormData();
    formData.append("sender", currentUserId);
    formData.append("reciever", selectedFriend.user.id);
  
    const messageToSend = newMessage.trim()
      ? encryptMessage(newMessage.trim(), friendPublicKey)
      : encryptMessage("\u200B", friendPublicKey);
    formData.append("message", messageToSend);
  
    if (mediaFile) {
      const sharedSecret = ec.keyFromPublic(friendPublicKey, "hex")
        .getPublic()
        .mul(ec.keyFromPrivate(privateKeyHex, "hex").getPrivate())
        .encode("hex");
  
      const encryptedBlob = await encryptMediaFile(mediaFile, sharedSecret);
      formData.append("media", new File([encryptedBlob], mediaFile.name));
    }
  
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
    if (groupImage) formData.append("image", groupImage);
  
    try {
      const res = await api.post("/api/create-group/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setGroups((prev) => [...prev, res.data]);
      setShowGroupOverlay(false);
      setCurrentStep(1);
      setGroupName("");
      setGroupBio("");
      setGroupImage(null);
      setSelectedMembers([]);
    } catch (err) {
      console.error("Error creating group", err);
    }
  };
  

  const handleGroupSelect = (group) => {
    console.log("Selected Group", group); 
    setSelectedGroup(group);
    setSelectedFriend(null); // clear private chat
  };

  const filteredFriends = friends.filter(friend =>
    friend.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="chatroom-container">
      <div className="chat-sidebar">
        <h2>ChatApp</h2>
        {/* <input className="search-input" placeholder="Search chat..." /> */}

        <div className="search-bar-wrapper">
          <input
            className="search-input"
            placeholder="Search chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm("")}
            >
              ❌
            </button>
          )}
        </div>



        <div className="sidebar-section friends-section">
          <div className="friends-header">
            <h3>Friends</h3>
            {/* (Optional) add a button here if you want */}
          </div>

          {searchTerm && (
            <div style={{ paddingLeft: "10px", fontWeight: "bold" }}>Matching Friends</div>
          )}

          <div className="friends-list">
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
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
              ))
            ): searchTerm ? (
              <div className="no-results">No matching friends</div>
            ) : null}
          </div>
        </div>

        <div className="sidebar-section groups-section">
          <div className="groups-header">
            <h3>Groups</h3>
            {/* <button onClick={() => setShowGroupOverlay(true)}>Create Group</button> */}
            
            <button
              className="create-group-btn"
              onClick={() => setShowGroupOverlay(true)}
            >
              Create Group
            </button>
          </div>

          {searchTerm && (
            <div style={{ paddingLeft: "10px", fontWeight: "bold" }}>Matching Groups</div>
          )}

          <div className="groups-list">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
              <div
                key={group.id}
                className={`chat-friend ${selectedGroup?.id === group.id ? "active" : ""}`}
                onClick={() => handleGroupSelect(group)}
              >
                {/* {console.log("Group Image Path:", group.image)}   */}
                <img
                  className="chat-avatar"
                  src={
                    group.image
                      ? group.image.startsWith("/media")
                        ? `${api.defaults.baseURL}/api${group.image}`  // ✅ add /api only once
                        : group.image  // already has full URL
                      : `${api.defaults.baseURL}/api/media/group_images/default.png`
                  }
                  alt={group.name}
                />
                <span>{group.name}</span>
              </div>
            ))
          ): searchTerm ? (
            <div className="no-results">No matching groups</div>
          ) : null}
          </div>
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
              {/* {console.log("Selected Group Image:", selectedGroup.image)}  */}
              <img
                className="chat-header-avatar"
                // src={selectedGroup.image ? `${api.defaults.baseURL}/api${selectedGroup.image}` : "/default.png"}
                src={selectedGroup.image ? selectedGroup.image : `${api.defaults.baseURL}/api/media/group_images/default.png`}
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
                  {msg.message && <div>{decryptMessage(msg.message) || "[Encrypted]"}</div>}
                    {/* {msg.media && !decryptedMediaURLs[msg.id] && (
                      <button
                        onClick={async () => {
                          try {
                            const sharedSecret = ec.keyFromPublic(friendPublicKey, "hex")
                              .getPublic()
                              .mul(ec.keyFromPrivate(privateKeyHex, "hex").getPrivate())
                              .encode("hex");

                            const response = await fetch(`${api.defaults.baseURL}/api${msg.media}`);
                            const encryptedBlob = await response.blob();
                            const decryptedBlob = await decryptMediaFile(encryptedBlob, sharedSecret);
                            const url = URL.createObjectURL(decryptedBlob);
                            setDecryptedMediaURLs((prev) => ({ ...prev, [msg.id]: url }));
                          } catch (err) {
                            console.error("Decryption failed", err);
                            alert("Could not decrypt media");
                          }
                        }}
                      >
                        🔓 View Encrypted Media
                      </button>
                    )} */}
                    {msg.media && decryptedMediaURLs[msg.id] && (
                      msg.media.endsWith(".mp4") ? (
                        <video src={decryptedMediaURLs[msg.id]} controls style={{ maxWidth: "300px" }} />
                      ) : (
                        <img src={decryptedMediaURLs[msg.id]} alt="decrypted" style={{ maxWidth: "300px" }} />
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
          {mediaFile && (
            <div className="media-preview">
              {mediaFile.type.startsWith("video") ? (
                <video src={URL.createObjectURL(mediaFile)} controls />
              ) : (
                <img src={URL.createObjectURL(mediaFile)} alt="preview" />
              )}
              <button className="remove-preview" onClick={() => setMediaFile(null)}>✖</button>
            </div>
          )}
        
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="type your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="icon-buttons">
              <label className="upload-icon">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setMediaFile(file);
                    e.target.value = null; // ✅ Reset input so same file can be selected again
                  }}
                />
                ⬆️
              </label>
              <button className="send-icon" onClick={handleSend}>➤</button>
            </div>
          </div>
        </div>    
        )}

        {showGroupOverlay && currentStep === 1 && (
          <div className="overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Create Group</h2>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  placeholder="Enter Group Name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="group-input"
                />
                <textarea
                  placeholder="Enter Group Bio"
                  value={groupBio}
                  onChange={(e) => setGroupBio(e.target.value)}
                  className="group-textarea"
                />
                <div className="group-image-input">
                  <div
                      className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith("image/")) {
                          setGroupImage(file);
                        }
                      }}
                    >
                      <span>📁 Click or Drag an image here</span>
                      <input
                        id="groupImageUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setGroupImage(e.target.files[0])}
                      />
                    </div>

                    {groupImage && (
                      <div className="group-image-preview">
                        <img src={URL.createObjectURL(groupImage)} alt="Group Preview" />
                        <button
                          className="remove-preview"
                          onClick={() => setGroupImage(null)}
                        >
                          ✖
                        </button>
                      </div>
                    )}
                  </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-cancel" onClick={() => setShowGroupOverlay(false)}>
                  Cancel
                </button>
                <button className="btn btn-next" onClick={() => setCurrentStep(2)}>
                  Next
                </button>
              </div>
            </div>
          </div>
        )}


        {showGroupOverlay && currentStep === 2 && (
          <div className="overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Select Members</h2>
              </div>
              <div className="modal-body friends-list">
                {friendsList.map((friend) => (
                  <div key={friend.id} className="friend-item">
                    {/* Left side: avatar + name */}
                    <div className="friend-left">
                      <img
                        className="friend-avatar"
                        src={
                          friend.user?.id && friendImages[friend.user.id]
                            ? `${api.defaults.baseURL}/api${friendImages[friend.user.id]}`
                            : "/default-avatar.png"
                        }
                        alt={friend.full_name}
                      />
                      <span className="friend-name">{friend.full_name}</span>
                    </div>

                    {/* Right side: checkbox */}
                    <input
                      type="checkbox"
                      id={`friend-${friend.id}`}
                      onChange={() => {
                        setSelectedMembers((prevState) =>
                          prevState.includes(friend.id)
                            ? prevState.filter((id) => id !== friend.id)
                            : [...prevState, friend.id]
                        );
                      }}
                    />
                  </div>
                ))}

              </div>
              <div className="modal-footer">
                <button className="btn btn-back" onClick={() => setCurrentStep(1)}>
                  Back
                </button>
                <button className="btn btn-create" onClick={handleCreateGroup}>
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatroomPage;
