import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import '../styles/EditListing.css';

const EditListing = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        status: 'draft'
    });
    const [thumbnail, setThumbnail] = useState(null);
    const [currentImage, setCurrentImage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const response = await api.get(`/api/seller/listings/${id}/`);
                setFormData({
                    title: response.data.title,
                    description: response.data.description,
                    price: response.data.price,
                    category: response.data.category,
                    status: response.data.status
                });
                if (response.data.thumbnail) {
                    setCurrentImage(response.data.thumbnail);
                }
            } catch (error) {
                console.error('Error fetching listing:', error);
                navigate('/seller/listings');
            }
        };
        fetchListing();
    }, [id, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title || !formData.price) {
            setError('Title and price are required');
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('price', formData.price);
        data.append('category', formData.category);
        data.append('status', formData.status);
        if (thumbnail) data.append('thumbnail', thumbnail);

        try {
            await api.put(`/api/seller/listings/${id}/`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            navigate('/seller/listings');
        } catch (error) {
            console.error('Error updating listing:', error);
            setError('Failed to update listing');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
                
                {error && <div className="error-message mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
                    <div className="mb-4">
                        <label className="block mb-2">Title*</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            rows="4"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2">Price*</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2">Category</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2">Thumbnail Image</label>
                        {currentImage && (
                            <img 
                                src={currentImage} 
                                alt="Current thumbnail" 
                                className="w-32 h-32 object-cover mb-2"
                            />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setThumbnail(e.target.files[0])}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/seller/listings')}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            Update Listing
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditListing;