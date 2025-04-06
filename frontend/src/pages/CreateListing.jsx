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
        status: 'draft',
        images: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreviews, setImagePreviews] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...previews]);

        // In a real app, you would upload to a server here
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...files]
        }));
    };

    const removeImage = (index) => {
        const newPreviews = [...imagePreviews];
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);

        const newImages = [...formData.images];
        newImages.splice(index, 1);
        setFormData(prev => ({ ...prev, images: newImages }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'images') {
                    formData.images.forEach(image => {
                        formDataToSend.append('images', image);
                    });
                } else {
                    formDataToSend.append(key, value);
                }
            });

            await api.post('/api/seller/listings/', formDataToSend, {
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
                    <label>Images</label>
                    <input
                        type="file"
                        multiple
                        onChange={handleImageUpload}
                        accept="image/*"
                    />
                    <div className="image-previews">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="image-preview">
                                <img src={preview} alt={`Preview ${index}`} />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="remove-image"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
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