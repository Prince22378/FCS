// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import '../../styles/ProductDetail.css';
import axios from 'axios';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/api/buyer/products/${id}/`);

                setProduct(response.data);
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = async (product) => {
        try {
            const response = await api.post('/api/cart/', {
                product_id: product.id,
                quantity: 1
            });
            alert("Added to cart!");
        } catch (error) {
            console.error("Add to Cart Error:", error.response?.data || error.message);
            if (error.response?.status === 401) {
                alert("You must be logged in to add items to cart.");
            } else {
                alert("Failed to add to cart.");
            }
        }
    };

    if (!product) return <p>Loading...</p>;

    return (
        <div className="product-detail">
            <img src={product.images?.[0] || '/placeholder.jpg'} alt={product.title} />
            <div className="info">
                <h2>{product.title}</h2>
                <p>{product.description}</p>
                <p>Category: {product.category}</p>
                <p>₹{product.price}</p>
                <p>Stock: {product.stock}</p>
                <button onClick={() => handleAddToCart(product)}>Add to Cart</button>

            </div>
        </div>
    );
};

export default ProductDetail;
