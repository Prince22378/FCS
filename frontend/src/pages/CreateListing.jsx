import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
// import '../styles/CreateListing.css';

const CreateListing = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        status: 'draft'
    });
    const [thumbnail, setThumbnail] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
            await api.post('/api/seller/listings/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            navigate('/seller/listings');
        } catch (error) {
            console.error('Error creating listing:', error);
            setError('Failed to create listing');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>

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
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2">Thumbnail Image</label>
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
                            Create Listing
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateListing;