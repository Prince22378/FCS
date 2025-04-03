import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
// import '../styles/SellerListings.css';

const SellerListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await api.get('/api/seller/listings/');
                setListings(response.data.listings);
            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, []);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/seller/listings/${id}/`);
            setListings(listings.filter(listing => listing.id !== id));
        } catch (error) {
            console.error('Error deleting listing:', error);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Your Listings</h1>
                <Link 
                    to="/seller/listings/create" 
                    className="btn-primary"
                >
                    ➕ Add New Listing
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">Product</th>
                            <th className="px-6 py-3 text-left">Price</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listings.map(listing => (
                            <tr key={listing.id} className="border-b">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <img 
                                            src={listing.thumbnail || '/default-listing.jpg'} 
                                            alt={listing.title}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                        <span className="ml-4">{listing.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">₹{listing.price}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        listing.status === 'active' ? 'bg-green-100 text-green-800' :
                                        listing.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {listing.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        to={`/seller/listings/edit/${listing.id}`}
                                        className="text-blue-600 hover:underline mr-4"
                                    >
                                        Edit
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(listing.id)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SellerListings;