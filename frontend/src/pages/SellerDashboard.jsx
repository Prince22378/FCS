// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import api from '../api';
// import "../styles/SellerDashboard.css";

// const SellerDashboard = () => {
//     const [stats, setStats] = useState({
//         totalSales: 0,
//         balance: 0
//     });
//     const [listings, setListings] = useState([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const [listingsRes, statsRes] = await Promise.all([
//                     api.get('/api/seller/listings/'),
//                     api.get('/api/seller/stats/')
//                 ]);

//                 setListings(listingsRes.data.listings || []);
//                 setStats(statsRes.data);
//             } catch (error) {
//                 console.error('Error fetching data:', error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchData();
//     }, []);

//     if (loading) return <div className="text-center py-8">Loading dashboard...</div>;

//     return (
//         <div className="container mx-auto px-4 py-8">
//             {/* 1️⃣ Overview Section */}
//             <section className="mb-8">
//                 <h2 className="text-2xl font-bold mb-4">📊 Overview</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                     <StatCard title="Total Sales" value={`₹${(stats.totalSales || 0).toLocaleString()}`} />
//                     <StatCard title="Available Balance" value={`₹${(stats.balance || 0).toLocaleString()}`} />
//                 </div>
//                 <div className="flex space-x-4">
//                     <Link to="/seller/listings/create" className="btn-primary">
//                         ➕ Add Product
//                     </Link>
//                 </div>
//             </section>

//             {/* 2️⃣ Product Management */}
//             <section>
//                 <div className="flex justify-between items-center mb-4">
//                     <h2 className="text-2xl font-bold">🛍️ Your Products</h2>
//                     <Link to="/seller/listings" className="text-blue-600 hover:underline">
//                         Manage All →
//                     </Link>
//                 </div>
//                 <ListingsGrid listings={listings.slice(0, 4)} />
//             </section>
//         </div>
//     );
// };

// // Helper components
// const StatCard = ({ title, value }) => (
//     <div className="bg-white p-4 rounded-lg shadow">
//         <h3 className="text-gray-500 text-sm">{title}</h3>
//         <p className="text-2xl font-bold">{value}</p>
//     </div>
// );

// const ListingsGrid = ({ listings }) => (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {listings.map(listing => (
//             <div key={listing.id} className="bg-white rounded-lg shadow overflow-hidden">
//                 <img
//                     src={listing.thumbnail || '/default-listing.jpg'}
//                     alt={listing.title}
//                     className="w-full h-40 object-cover"
//                 />
//                 <div className="p-4">
//                     <h3 className="font-bold truncate">{listing.title}</h3>
//                     <p className="text-gray-600">₹{listing.price}</p>
//                     <div className="flex justify-between mt-2">
//                         <span className={`text-xs px-2 py-1 rounded ${listing.status === 'active' ? 'bg-green-100 text-green-800' :
//                             listing.status === 'draft' ? 'bg-gray-100 text-gray-800' :
//                                 'bg-red-100 text-red-800'
//                             }`}>
//                             {listing.status}
//                         </span>
//                         <Link
//                             to={`/seller/listings/edit/${listing.id}`}
//                             className="text-blue-600 hover:underline text-sm"
//                         >
//                             Edit
//                         </Link>
//                     </div>
//                 </div>
//             </div>
//         ))}
//     </div>
// );

// export default SellerDashboard;



import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import "../styles/SellerDashboard.css";

const SellerDashboard = () => {
    const [stats, setStats] = useState({
        total_sales: 0,
        balance: 0
    });
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [listingsRes, statsRes] = await Promise.all([
                    api.get('/api/seller/listings/'),
                    api.get('/api/seller/stats/')
                ]);

                setListings(listingsRes.data.listings || []);
                setStats(statsRes.data.stats || {});
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="text-center py-8">Loading dashboard...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Overview Section */}
            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">📊 Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <StatCard title="Total Sales" value={`₹${(stats.total_sales || 0).toLocaleString()}`} />
                    <StatCard title="Available Balance" value={`₹${(stats.balance || 0).toLocaleString()}`} />
                </div>
                <div className="flex space-x-4">
                    <Link to="/seller/listings/create" className="btn-primary">
                        ➕ Add Product
                    </Link>
                </div>
            </section>

            {/* Product Management Section */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">🛍️ Your Products</h2>
                    <Link to="/seller/listings" className="text-blue-600 hover:underline">
                        Manage All →
                    </Link>
                </div>
                <ListingsGrid listings={listings.slice(0, 4)} />
            </section>
        </div>
    );
};

const StatCard = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);

const ListingsGrid = ({ listings }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {listings.map(listing => (
            <div key={listing.id} className="bg-white rounded-lg shadow overflow-hidden">
                <img
                    src={listing.thumbnail || '/default-listing.jpg'}
                    alt={listing.title}
                    className="w-full h-40 object-cover"
                />
                <div className="p-4">
                    <h3 className="font-bold truncate">{listing.title}</h3>
                    <p className="text-gray-600">₹{listing.price}</p>
                    <div className="flex justify-between mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${listing.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : listing.status === 'draft'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {listing.status}
                        </span>
                        <Link
                            to={`/seller/listings/edit/${listing.id}`}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            Edit
                        </Link>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default SellerDashboard;
