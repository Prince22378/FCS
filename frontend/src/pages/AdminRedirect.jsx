import { useEffect } from "react";

const AdminRedirect = () => {
  useEffect(() => {
    window.location.href = "http://127.0.0.1:8000/admin/";
  }, []);

  return <p>Redirecting to Admin Panel...</p>;
};

export default AdminRedirect;
