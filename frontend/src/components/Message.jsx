const Message = ({ message, loggedInUserId }) => {
    const isSender = message.sender.id === loggedInUserId;
    return (
      <div className={`p-2 my-2 max-w-xs ${isSender ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 text-black self-start'}`} style={{ borderRadius: "10px", padding: "8px", marginBottom: "5px" }}>
        <p><strong>{isSender ? "You" : message.sender.username}:</strong> {message.message}</p>
      </div>
    );
  };
  
  export default Message;