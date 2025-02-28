import { Link } from "react-router-dom";

const UserListItem = ({ user, message, chatUserId }) => {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center">
        <img
          src={user?.image || "default.jpg"}
          alt={user?.full_name || "User"}
          className="w-10 h-10 rounded-full mr-4"
          onError={(e) => {
            e.target.src = "default.jpg";
          }}
        />
        <div>
          <h3 className="text-lg font-bold">
            {user?.full_name || user?.user?.username || "Unknown User"}
          </h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
      <Link to={`/message/${chatUserId}`} className="text-blue-500 hover:underline">
        Chat
      </Link>
    </div>
  );
};

export default UserListItem;
