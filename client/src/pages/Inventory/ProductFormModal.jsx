import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, XCircle } from 'lucide-react';
import { uploadImage } from '../../services/storageService';
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
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (initialData) {
            // Ensure category_id is properly converted to string for select
            const categoryId = initialData.category_id 
                ? String(initialData.category_id) 
                : '';
            
            setFormData({
                name: initialData.name || '',
                barcode: initialData.barcode || '',
                category_id: categoryId,
                retail_price: initialData.price || '', // Note: mapped from 'price' in UI to 'retail_price' in DB
                cost_price: initialData.cost_price || '',
                stock_quantity: initialData.stock || '', // Mapped from 'stock'
                min_stock_level: initialData.min_stock_level || 10,
                image_url: initialData.image || ''
            });
            // Set preview if image exists
            if (initialData.image) {
                setImagePreview(initialData.image);
            } else {
                setImagePreview(null);
            }
        } else {
            // For new products, set first category as default (skip 'all')
            const firstCategory = categories.find(c => c.id !== 'all');
            setFormData({
                name: '',
                barcode: '',
                category_id: firstCategory ? String(firstCategory.id) : '',
                retail_price: '',
                cost_price: '',
                stock_quantity: '',
                min_stock_level: 10,
                image_url: ''
            });
            setImagePreview(null);
        }
        // Reset file input when modal opens/closes
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [initialData, categories, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image_url: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            let imageUrl = formData.image_url;

            // Upload image if a new file is selected
            if (imageFile) {
                const uploadResult = await uploadImage(imageFile, 'products');
                if (!uploadResult.success) {
                    alert(`Failed to upload image: ${uploadResult.error}`);
                    setUploading(false);
                    return;
                }
                imageUrl = uploadResult.url;
            }

            // Prepare form data with proper type conversions
            const submitData = {
                name: formData.name.trim(),
                barcode: formData.barcode.trim() || null,
                retail_price: parseFloat(formData.retail_price) || 0,
                cost_price: parseFloat(formData.cost_price) || 0,
                stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
                min_stock_level: parseInt(formData.min_stock_level, 10) || 10,
                is_active: true
            };

            // Handle category_id - ensure it's a valid integer
            const categoryId = formData.category_id ? parseInt(formData.category_id, 10) : null;
            if (categoryId && !isNaN(categoryId) && categoryId > 0) {
                submitData.category_id = categoryId;
            } else {
                // If no valid category, don't include it (or set to null)
                submitData.category_id = null;
            }

            // Handle image_url
            if (imageUrl && imageUrl.trim()) {
                submitData.image_url = imageUrl.trim();
            } else {
                submitData.image_url = null;
            }

            await onSubmit(submitData);
        } catch (error) {
            console.error('Error in form submission:', error);
            alert(`Error: ${error.message || 'Failed to submit form'}`);
        } finally {
            setUploading(false);
        }
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
                        <label>Product Image</label>
                        <div className="image-upload-container">
                            {imagePreview ? (
                                <div className="image-preview-wrapper">
                                    <img src={imagePreview} alt="Preview" className="image-preview" />
                                    <button
                                        type="button"
                                        className="remove-image-btn"
                                        onClick={removeImage}
                                        title="Remove image"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="image-upload-placeholder">
                                    <ImageIcon size={48} />
                                    <p>No image selected</p>
                                </div>
                            )}
                            <div className="image-upload-controls">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="file-input"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="upload-btn">
                                    <Upload size={18} />
                                    {imageFile ? 'Change Image' : 'Upload Image'}
                                </label>
                                {!imageFile && (
                                    <input
                                        type="text"
                                        name="image_url"
                                        value={formData.image_url}
                                        onChange={handleChange}
                                        placeholder="Or enter image URL"
                                        className="image-url-input"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormModal;
