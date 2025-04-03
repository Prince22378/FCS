import React, { useState, useEffect } from 'react';
import api from '../api';
import ListingCard from '../components/ListingCard';
import "../styles/BuyerMarketplace.css";

const BuyerMarketplace = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await api.get('/api/marketplace/buyer/');
                setListings(response.data.listings || []);
            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, []);

    if (loading) return <div>Loading marketplace...</div>;

    return (
        <div className="buyer-marketplace">
            <h1>Marketplace Listings</h1>
            <div className="listings-grid">
                {listings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} />
                ))}
            </div>
        </div>
    );
};

export default BuyerMarketplace;