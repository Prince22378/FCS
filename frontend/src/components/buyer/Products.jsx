import React, { useEffect, useState } from 'react';
import api from '../../api';
import '../../styles/Products.css';
import { Link } from 'react-router-dom';


const Products = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/api/buyer/products/');
                const productList = response.data.results || [];  // safe check
                setProducts(productList);
                setFilteredProducts(productList);
            } catch (error) {
                console.error('Error fetching products:', error);
                setProducts([]);
                setFilteredProducts([]);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const filtered = products.filter((product) =>
            product.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    return (
        <div className="products-page">
            <h1>All Products</h1>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search products by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="product-grid">
                {Array.isArray(filteredProducts) && filteredProducts.length === 0 ? (
                    <p>No products found.</p>
                ) : (
                    filteredProducts.map((product) => (
                        <Link to={`/buyer/products/${product.id}`} key={product.id} className="product-card-link">
                            <div className="product-card">
                                <img
                                    src={product.images?.[0] || '/placeholder.jpg'}
                                    alt={product.title}
                                    className="product-image"
                                />
                                <div className="product-details">
                                    <h3>{product.title}</h3>
                                    <p className="price">₹{product.price}</p>
                                    <p className="stock">Stock: {product.stock}</p>
                                    <p className="category">{product.category}</p>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default Products;
