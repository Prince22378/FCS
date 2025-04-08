// // ListingCard.jsx
// import React from 'react';
// import { Link } from 'react-router-dom';

// const ListingCard = ({ listing }) => {
//     return (
//         <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
//             <div className="p-4">
//                 <h3 className="text-xl font-semibold mb-2">{listing.title}</h3>
//                 <p className="text-gray-600 mb-4">{listing.description}</p>

//                 <div className="flex justify-between items-center">
//                     <span className="text-lg font-bold">${listing.price}</span>
//                     <span className="text-sm text-gray-500">
//                         {listing.category}
//                     </span>
//                 </div>

//                 <div className="mt-4">
//                     <Link
//                         to={`/listing/${listing.id}`}
//                         className="text-blue-600 hover:text-blue-800 font-medium"
//                     >
//                         View Details
//                     </Link>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ListingCard;


import React from 'react';
import { Link } from 'react-router-dom';

const ListingCard = ({ listing }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{listing.title}</h3>
                <p className="text-gray-600 mb-4">{listing.description}</p>

                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">₹{listing.price}</span>
                    <span className="text-sm text-gray-500">
                        {listing.category}
                    </span>
                </div>

                <div className="mt-4">
                    <Link
                        to={`/listing/${listing.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ListingCard;
