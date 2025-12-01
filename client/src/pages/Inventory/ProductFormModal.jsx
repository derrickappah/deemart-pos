import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './ProductFormModal.css';

const ProductFormModal = ({ isOpen, onClose, onSubmit, initialData, categories }) => {
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        category_id: '',
        retail_price: '',
        cost_price: '',
        stock_quantity: '',
        min_stock_level: '',
        image_url: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                barcode: initialData.barcode || '',
                category_id: initialData.category_id || '',
                retail_price: initialData.price || '', // Note: mapped from 'price' in UI to 'retail_price' in DB
                cost_price: initialData.cost_price || '',
                stock_quantity: initialData.stock || '', // Mapped from 'stock'
                min_stock_level: initialData.min_stock_level || 10,
                image_url: initialData.image || ''
            });
        } else {
            setFormData({
                name: '',
                barcode: '',
                category_id: categories[0]?.id || '',
                retail_price: '',
                cost_price: '',
                stock_quantity: '',
                min_stock_level: 10,
                image_url: ''
            });
        }
    }, [initialData, categories, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            retail_price: parseFloat(formData.retail_price),
            cost_price: parseFloat(formData.cost_price || 0),
            stock_quantity: parseInt(formData.stock_quantity),
            min_stock_level: parseInt(formData.min_stock_level || 10),
            category_id: parseInt(formData.category_id),
            is_active: true
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{initialData ? 'Edit Product' : 'Add New Product'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="product-form">
                    <div className="form-group">
                        <label>Product Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Barcode</label>
                            <input
                                type="text"
                                name="barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.filter(c => c.id !== 'all').map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Retail Price (GHS)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="retail_price"
                                value={formData.retail_price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Cost Price (GHS)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="cost_price"
                                value={formData.cost_price}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Stock Quantity</label>
                            <input
                                type="number"
                                name="stock_quantity"
                                value={formData.stock_quantity}
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Min Stock Level</label>
                            <input
                                type="number"
                                name="min_stock_level"
                                value={formData.min_stock_level}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Image URL</label>
                        <input
                            type="text"
                            name="image_url"
                            value={formData.image_url}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormModal;
