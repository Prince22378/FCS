import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/CreateListing.css';

const CreateListing = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        status: 'active', // Default to active to appear on buyer's page
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null); // Changed to single image
    const [imageFile, setImageFile] = useState(null); // Store the single image file

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0]; // Get only the first file
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            setImageFile(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            
            // Append all form fields
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });
            
            // Append the single image if it exists
            if (imageFile) {
                formDataToSend.append('thumbnail', imageFile);
            }

            await api.post('/api/seller/listings/create/', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            navigate('/seller/listings');
        } catch (error) {
            console.error('Error creating listing:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-listing">
            <h1>Create New Listing</h1>

            <form onSubmit={handleSubmit} className="listing-form">
                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Price (₹)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Stock Quantity</label>
                        <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            min="0"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a category</option>
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="home">Home & Kitchen</option>
                        <option value="books">Books</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Product Image</label> {/* Changed label */}
                    <input
                        type="file"
                        onChange={handleImageUpload}
                        accept="image/*"
                    />
                    {imagePreview && (
                        <div className="image-preview">
                            <img src={imagePreview} alt="Preview" />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="remove-image"
                            >
                                × Remove
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                >
                    {isSubmitting ? 'Creating...' : 'Create Listing'}
                </button>
            </form>
        </div>
    );
};

export default CreateListing;