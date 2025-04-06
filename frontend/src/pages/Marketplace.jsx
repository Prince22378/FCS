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
                    onClick={() => navigate('/buyer')}
                    className="buyer-btn"
                >
                    Continue as Buyer
                </button>
            </div>
        </div>
    );
}

export default Marketplace;
