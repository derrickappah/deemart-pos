import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { getProducts, getCategories } from '../../services/productService';

const ProductGrid = ({ searchTerm = '' }) => {
    const { addToCart } = useCart();
    const { showToast } = useNotification();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [productsData, categoriesData] = await Promise.all([
                    getProducts(),
                    getCategories()
                ]);
                setProducts(productsData);
                setCategories([{ id: 'all', name: 'All' }, ...categoriesData]);
            } catch (err) {
                console.error('Error loading products:', err);
                setError(err.message || 'Failed to load products');
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: err.message || 'Failed to load products'
                });
                setProducts([]);
                setCategories([{ id: 'all', name: 'All' }]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [showToast]);

    const filteredProducts = products.filter(product => {
        const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
        const matchesSearch = !searchTerm || searchTerm.trim().length < 2 || 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const handleAddToCart = (product) => {
        if (product.stock <= 0) {
            showToast({
                type: 'warning',
                title: 'Out of Stock',
                message: `${product.name} is out of stock`
            });
            return;
        }
        addToCart(product);
    };

    if (loading) {
        return <div className="loading">Loading products...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="product-section">
            {/* Category Filter */}
            <div className="category-filter">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-btn ${activeCategory === cat.name ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.name)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="product-grid">
                {filteredProducts.length === 0 ? (
                    <div className="empty-state">No products found</div>
                ) : (
                    filteredProducts.map(product => (
                        <div 
                            key={product.id} 
                            className={`product-card ${product.stock <= 0 ? 'out-of-stock' : ''}`}
                            onClick={() => handleAddToCart(product)}
                        >
                            <div className="product-image">
                                <img src={product.image} alt={product.name} />
                                {product.stock <= 0 && (
                                    <div className="out-of-stock-overlay">Out of Stock</div>
                                )}
                            </div>
                            <div className="product-info">
                                <h3 className="product-name">{product.name}</h3>
                                <div className="product-price">GHS {product.price.toFixed(2)}</div>
                                {product.stock > 0 && product.stock <= 10 && (
                                    <div className="low-stock-indicator">Low Stock ({product.stock})</div>
                                )}
                            </div>
                            <button className="add-btn" disabled={product.stock <= 0}>
                                <Plus size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductGrid;
