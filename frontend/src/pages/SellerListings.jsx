import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ListingCard from '../components/ListingCard';
import '../styles/SellerListings.css';

const SellerListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await api.get('/api/seller/listings/');
                setListings(response.data || []);

            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    const filteredListings = filter === 'all'
        ? listings
        : listings.filter(listing => listing.status === filter);

    return (
        <div className="seller-listings">
            <div className="listings-header">
                <h1>Your Listings</h1>
                <Link to="/seller/listings/create" className="btn btn-primary">
                    ➕ Add New Product
                </Link>
            </div>

            <div className="filter-buttons">
                <button
                    onClick={() => setFilter('all')}
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                >
                    Active
                </button>
                <button
                    onClick={() => setFilter('draft')}
                    className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
                >
                    Drafts
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading listings...</div>
            ) : (
                <div className="listings-grid">
                    {filteredListings.map(listing => (
                        <ListingCard key={listing.id} listing={listing} isSellerView={true} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SellerListings;