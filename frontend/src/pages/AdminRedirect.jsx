import { useEffect, useState } from "react";
import api from "../api";

const AdminRedirect = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminUrl = async () => {
      try {
        const response = await api.get("/admin/"); 
        window.location.href = adminUrl;
      } catch (error) {
        console.error("Error fetching admin URL:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminUrl();
  }, []);

  return <p>{loading ? "Redirecting to Admin Panel..." : "Failed to redirect."}</p>;
};

export default AdminRedirect;