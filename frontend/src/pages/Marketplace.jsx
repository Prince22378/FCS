

// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../api";
// import { jwtDecode } from "jwt-decode";
// import { ACCESS_TOKEN } from "../constants";
// import "../styles/Marketplace.css";

// function Marketplace() {
//     const navigate = useNavigate();
//     const [user, setUser] = useState(null);
//     const [verified, setVerified] = useState(false);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const checkVerification = async () => {
//             try {
//                 const token = localStorage.getItem(ACCESS_TOKEN);
//                 if (!token) return navigate("/login");

//                 const decoded = jwtDecode(token);
//                 const response = await api.get(`/api/profile/${decoded.user_id}/`);

//                 setUser(response.data);
//                 setVerified(response.data.verified);
//                 setLoading(false);

//             } catch (error) {
//                 console.error("Error checking verification:", error);
//                 navigate("/login");
//             }
//         };

//         checkVerification();
//     }, [navigate]);

//     if (loading) return <div>Loading...</div>;

//     if (!verified) {
//         return (
//             <div className="verification-required">
//                 <h2>User Not Verified</h2>
//                 <p>Please verify your account to access marketplace features</p>
//                 <button
//                     onClick={() => navigate("/")}
//                     className="verify-button"
//                 >
//                     Verify Account
//                 </button>
//             </div>
//         );
//     }

//     return (
//         <div className="marketplace-options">
//             <h2>Welcome to Marketplace</h2>
//             <div className="option-buttons">
//                 <button
//                     onClick={() => {
//                         localStorage.removeItem(ACCESS_TOKEN);
//                         navigate("/login?redirect=/seller-dashboard");
//                     }}
//                     className="seller-btn"
//                 >
//                     Login as Seller
//                 </button>
//                 <button
//                     onClick={() => navigate("/marketplace/buyer")}
//                     className="buyer-btn"
//                 >
//                     Continue as Buyer
//                 </button>
//             </div>
//         </div>
//     );
// }

// export default Marketplace;



import { useNavigate } from 'react-router-dom';
import "../styles/Marketplace.css";

function Marketplace() {
    const navigate = useNavigate();

    return (
        <div className="marketplace-options">
            <h2>Welcome to Marketplace</h2>
            <div className="option-buttons">
                <button
                    onClick={() => navigate('/seller')}
                    className="seller-btn"
                >
                    Login as Seller
                </button>
                <button
                    onClick={() => navigate('/marketplace/buyer')} // This goes to BuyerMarketplace.jsx
                    className="buyer-btn"
                >
                    Continue as Buyer
                </button>
            </div>
        </div>
    );
}

export default Marketplace;
