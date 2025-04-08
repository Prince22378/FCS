import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import CryptoJS from "crypto-js";
import { ec as EC } from "elliptic";
import { PRIVATE_KEY } from "../constants";
import "../styles/GroupChat.css";

const ec = new EC("p256");

const GroupChat = ({ selectedGroup, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [decryptedMediaURLs, setDecryptedMediaURLs] = useState({});
  const isFetchingRef = useRef(false);
  const bottomRef = useRef(null);
  const [showAddMembersOverlay, setShowAddMembersOverlay] = useState(false);
  const [showCurrentMembersOverlay, setShowCurrentMembersOverlay] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get("/api/friends/");
        setFriendsList(res.data);
      } catch (err) {
        console.error("Error fetching friends list", err);
      }
    };

    if (showAddMembersOverlay) fetchFriends();
  }, [showAddMembersOverlay]);

  const fetchGroupMessages = async () => {
    if (!selectedGroup || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await api.get(`/api/groups/${selectedGroup.id}/messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching group messages:", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const getMemberName = (memberId) => {
    const friend = friendsList.find((f) => f.id === memberId);
    return friend ? friend.full_name : "Unknown User";
  };

  const generateAESKey = () => CryptoJS.lib.WordArray.random(32).toString();

  const encryptWithAES = (msg, key) =>
    CryptoJS.AES.encrypt(msg, key).toString();
  const decryptWithAES = (cipher, key) =>
    CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8);

  const encryptAESKeyForUser = (aesKey, publicKeyHex) => {
    const pub = ec.keyFromPublic(publicKeyHex, "hex");
    const ephemeral = ec.genKeyPair();
    const shared = pub.getPublic().mul(ephemeral.getPrivate()).encode("hex");
    const encryptedAESKey = CryptoJS.AES.encrypt(aesKey, shared).toString();
    return ephemeral.getPublic().encode("hex", true) + encryptedAESKey;
  };

  const decryptAESKey = (encryptedBlob, privateKeyHex) => {
    const senderPubKeyHex = encryptedBlob.slice(0, 66);
    const encrypted = encryptedBlob.slice(66);
    const receiverKey = ec.keyFromPrivate(privateKeyHex, "hex");
    const senderPub = ec.keyFromPublic(senderPubKeyHex, "hex");
    const shared = senderPub
      .getPublic()
      .mul(receiverKey.getPrivate())
      .encode("hex");
    return CryptoJS.AES.decrypt(encrypted, shared).toString(CryptoJS.enc.Utf8);
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
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedGroup || isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const res = await api.get(`/api/groups/${selectedGroup.id}/messages/`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching group messages:", err);
      } finally {
        isFetchingRef.current = false;
      }
    };

    const interval = setInterval(fetchMessages, 2000);
    fetchMessages();
    return () => clearInterval(interval);
  }, [selectedGroup]);


  useEffect(() => {
    const decryptAllMedia = async () => {
      for (const msg of messages) {
        if (msg.media && msg.recipient_keys) {
          const keyEntry = msg.recipient_keys.find(k => k.recipient_id === currentUserId);
          if (!keyEntry || decryptedMediaURLs[msg.id]) continue;

          try {
            const aesKey = decryptAESKey(keyEntry.encrypted_key, localStorage.getItem(PRIVATE_KEY));
            const response = await fetch(`${api.defaults.baseURL}/api${msg.media}`);
            const encryptedBlob = await response.blob();
            const decryptedBlob = await decryptMediaFile(encryptedBlob, aesKey);
            const url = URL.createObjectURL(decryptedBlob);
            setDecryptedMediaURLs(prev => ({ ...prev, [msg.id]: url }));
          } catch (err) {
            console.error("Media decryption failed for msg", msg.id, err);
          }
        }
      }
    };
    decryptAllMedia();
  }, [messages]);


  useEffect(() => {
    let isActive = true;

    const loopFetch = async () => {
      if (!isActive) return;
      await fetchGroupMessages();
      setTimeout(loopFetch, 2000);
    };

    loopFetch();
    return () => {
      isActive = false;
    };
  }, [selectedGroup]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // const handleSend = async () => {
  //   if (!newMessage.trim() && !mediaFile) return;

  //   const formData = new FormData();
  //   formData.append("content", newMessage);
  //   if (mediaFile) formData.append("media", mediaFile);

  //   try {
  //     const res = await api.post(
  //       `/api/groups/${selectedGroup.id}/messages/`,
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //       }
  //     );
  //     setMessages((prev) => [...prev, res.data]);
  //     setNewMessage("");
  //     setMediaFile(null);
  //   } catch (err) {
  //     console.error("Error sending message:", err);
  //   }
  // };

  const handleSend = async () => {
    if (!newMessage.trim() && !mediaFile) return;

    const privateKeyHex = localStorage.getItem(PRIVATE_KEY);
    const aesKey = generateAESKey();
    const encryptedContent = encryptWithAES(newMessage.trim(), aesKey);

    const groupDetails = await api.get(`/api/groups/${selectedGroup.id}/`);
    const members = groupDetails.data.members;

    const encrypted_keys = await Promise.all(
      members.map(async (memberId) => {
        const res = await api.get(`/api/public-profile/${memberId}/`);
        const publicKey = res.data.public_key;
        return {
          recipient_id: memberId,
          encrypted_key: encryptAESKeyForUser(aesKey, publicKey),
        };
      })
    );

    const formData = new FormData();
    formData.append("content", encryptedContent);
    encrypted_keys.forEach((key) =>
      formData.append("encrypted_keys", JSON.stringify(key))
    );
    if (mediaFile) {
      const encryptedMedia = await encryptMediaFile(mediaFile, aesKey);
      formData.append("media", new File([encryptedMedia], mediaFile.name));
    }

    try {
      const res = await api.post(
        `/api/groups/${selectedGroup.id}/messages/`,
        formData
      );
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      setMediaFile(null);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="group-chat-window">
      <div className="group-chat-body">
        {messages.map((msg, i) => {
          const isMe = msg.sender.id === currentUserId;
          return (
            <div
              key={i}
              className={`chat-message ${isMe ? "sent" : "received"}`}
            >
              <div className="message-sender">
                {!isMe && <strong>{msg.sender.username}</strong>}
              </div>
              {msg.content &&
              (() => {
                try {
                  const keyEntry = msg.recipient_keys.find(
                    (k) => k.recipient_id === currentUserId
                  );
                  if (!keyEntry) return "[No key]";
                  const aesKey = decryptAESKey(
                    keyEntry.encrypted_key,
                    localStorage.getItem(PRIVATE_KEY)
                  );
                  return <div>{decryptWithAES(msg.content, aesKey)}</div>;
                } catch {
                  return <div>[Encrypted]</div>;
                }
              })()}

              {msg.media && decryptedMediaURLs[msg.id] && (
                msg.media.endsWith(".mp4") ? (
                  <video src={decryptedMediaURLs[msg.id]} controls style={{ maxWidth: "300px" }} />
                ) : (
                  <img src={decryptedMediaURLs[msg.id]} alt="media" style={{ maxWidth: "300px" }} />
                )
              )}
              <div className="chat-meta">
                <small>{formatTime(msg.created_at)}</small>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="group-chat-input">
        {mediaFile && (
          <div className="media-preview">
            {mediaFile.type.startsWith("video") ? (
              <video src={URL.createObjectURL(mediaFile)} controls />
            ) : (
              <img src={URL.createObjectURL(mediaFile)} alt="preview" />
            )}
            <button
              className="remove-preview"
              onClick={() => setMediaFile(null)}
            >
              ✖
            </button>
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
                onChange={(e) => setMediaFile(e.target.files[0])}
              />
              ⬆️
            </label>
            <button className="send-icon" onClick={handleSend}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
