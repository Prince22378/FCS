export default function ListingTable({ listings }) {
    return (
        <div className="table-responsive">
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {listings.map((listing) => (
                        <tr key={listing.id}>
                            <td>{listing.id}</td>
                            <td>
                                <img
                                    src={listing.thumbnail}
                                    alt={listing.title}
                                    width="50"
                                    className="me-2"
                                />
                                {listing.title}
                            </td>
                            <td>${listing.price.toFixed(2)}</td>
                            <td>
                                <span className={`badge ${getStatusBadgeClass(listing.status)}`}>
                                    {listing.status}
                                </span>
                            </td>
                            <td>
                                <button className="btn btn-sm btn-outline-primary me-2">
                                    Edit
                                </button>
                                <button className="btn btn-sm btn-outline-danger">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}