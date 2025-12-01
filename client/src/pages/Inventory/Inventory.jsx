import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { getProducts, getCategories, deleteProduct, addProduct, updateProduct } from '../../services/productService';
import { useNotification } from '../../context/NotificationContext';
import ProductFormModal from './ProductFormModal';
import './Inventory.css';

const Inventory = () => {
    const { showToast } = useNotification();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

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
            console.error('Error loading data:', err);
            setError(err.message || 'Failed to load data');
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to load products and categories'
            });
            setProducts([]);
            setCategories([{ id: 'all', name: 'All' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const result = await deleteProduct(id);
                if (result.success) {
                    showToast({
                        type: 'success',
                        title: 'Success',
                        message: 'Product deleted successfully'
                    });
                    loadData();
                } else {
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: result.error || 'Failed to delete product'
                    });
                }
            } catch (err) {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: err.message || 'Failed to delete product'
                });
            }
        }
    };

    const handleAddClick = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            let result;
            if (editingProduct) {
                result = await updateProduct(editingProduct.id, formData);
            } else {
                result = await addProduct(formData);
            }

            if (result.success) {
                showToast({
                    type: 'success',
                    title: 'Success',
                    message: editingProduct ? 'Product updated successfully' : 'Product added successfully'
                });
                setIsModalOpen(false);
                loadData();
            } else {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: result.error || 'Operation failed'
                });
            }
        } catch (err) {
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Operation failed'
            });
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="inventory-container">
            <div className="inventory-header">
                <h1>Inventory Management</h1>
                <button className="btn btn-primary" onClick={handleAddClick}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Add Product
                </button>
            </div>

            <div className="inventory-controls">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <Filter size={18} className="filter-icon" />
                    <select
                        value={activeCategory}
                        onChange={(e) => setActiveCategory(e.target.value)}
                        className="category-select"
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price (Retail)</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center">Loading...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="6" className="text-center error-text">{error}</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan="6" className="text-center">No products found</td></tr>
                        ) : (
                            filteredProducts.map(product => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="product-cell">
                                            <img src={product.image} alt="" className="product-thumb" />
                                            <span>{product.name}</span>
                                        </div>
                                    </td>
                                    <td>{product.category}</td>
                                    <td>GHS {product.price.toFixed(2)}</td>
                                    <td>{product.stock}</td>
                                    <td>
                                        <span className={`status-badge ${product.stock < 10 ? 'low-stock' : 'in-stock'}`}>
                                            {product.stock < 10 ? 'Low Stock' : 'In Stock'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="icon-btn edit" title="Edit" onClick={() => handleEditClick(product)}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(product.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingProduct}
                categories={categories}
            />
        </div>
    );
};

export default Inventory;
