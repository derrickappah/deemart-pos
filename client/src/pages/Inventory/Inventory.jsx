import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Edit, Trash2, Filter, Download, Upload } from 'lucide-react';
import { getProducts, getCategories, deleteProduct, addProduct, updateProduct, getAllProductsForExport, bulkImportProducts } from '../../services/productService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import ProductFormModal from './ProductFormModal';
import { exportToCSV, exportToJSON, parseCSV, parseJSON } from '../../utils/exportUtils';
import './Inventory.css';

const Inventory = () => {
    const { showToast } = useNotification();
    const { user, isAdmin, isManager } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    
    // Import/Export State
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const fileInputRef = useRef(null);

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
            // Check permissions for update/add operations
            if (editingProduct && !isAdmin && !isManager) {
                showToast({
                    type: 'error',
                    title: 'Permission Denied',
                    message: 'Only admins and managers can update products. Your role: ' + (user?.role || 'cashier')
                });
                return;
            }

            if (!editingProduct && !isAdmin && !isManager) {
                showToast({
                    type: 'error',
                    title: 'Permission Denied',
                    message: 'Only admins and managers can add products. Your role: ' + (user?.role || 'cashier')
                });
                return;
            }

            let result;
            if (editingProduct) {
                // Ensure we have a valid product ID
                const productId = editingProduct.id;
                if (!productId) {
                    throw new Error('Product ID is missing. Please try again.');
                }
                
                console.log('Updating product:', { productId, formData, userRole: user?.role });
                result = await updateProduct(productId, formData);
            } else {
                console.log('Adding product:', formData);
                result = await addProduct(formData);
            }

            if (result.success) {
                showToast({
                    type: 'success',
                    title: 'Success',
                    message: editingProduct ? 'Product updated successfully' : 'Product added successfully'
                });
                setIsModalOpen(false);
                setEditingProduct(null); // Clear editing state
                loadData();
            } else {
                console.error('Operation failed:', result.error);
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: result.error || 'Operation failed'
                });
            }
        } catch (err) {
            console.error('Error in handleFormSubmit:', err);
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

    // Calculate total inventory values
    const { totalRetailValue, totalCostValue } = useMemo(() => {
        const retail = filteredProducts.reduce((sum, product) => {
            const price = product.price || 0;
            const stock = product.stock || 0;
            return sum + (price * stock);
        }, 0);

        const cost = filteredProducts.reduce((sum, product) => {
            const costPrice = product.cost_price || 0;
            const stock = product.stock || 0;
            return sum + (costPrice * stock);
        }, 0);

        return {
            totalRetailValue: retail,
            totalCostValue: cost
        };
    }, [filteredProducts]);

    const handleExportInventory = async (format = 'csv') => {
        if (!isAdmin && !isManager) {
            showToast({
                type: 'error',
                title: 'Permission Denied',
                message: 'Only admins and managers can export inventory'
            });
            return;
        }

        setIsExporting(true);
        try {
            const products = await getAllProductsForExport();
            
            if (products.length === 0) {
                showToast({
                    type: 'warning',
                    title: 'No Data',
                    message: 'No products to export'
                });
                return;
            }

            // Format data for export
            const exportData = products.map(p => ({
                Name: p.name,
                Barcode: p.barcode || '',
                SKU: p.sku || '',
                Category: p.category,
                'Cost Price': p.cost_price,
                'Retail Price': p.retail_price,
                'Wholesale Price': p.wholesale_price || '',
                'Stock Quantity': p.stock_quantity,
                'Min Stock Level': p.min_stock_level,
                'Max Stock Level': p.max_stock_level || '',
                'Image URL': p.image_url || '',
                'Expiry Date': p.expiry_date || '',
                'Supplier ID': p.supplier_id || '',
                'Is Active': p.is_active
            }));

            const timestamp = new Date().toISOString().split('T')[0];
            if (format === 'json') {
                exportToJSON(exportData, `inventory_export_${timestamp}.json`);
            } else {
                exportToCSV(exportData, `inventory_export_${timestamp}.csv`);
            }

            showToast({
                type: 'success',
                title: 'Export Successful',
                message: `Exported ${products.length} products to ${format.toUpperCase()}`
            });
        } catch (err) {
            console.error('Error exporting inventory:', err);
            showToast({
                type: 'error',
                title: 'Export Failed',
                message: err.message || 'Failed to export inventory'
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportClick = () => {
        if (!isAdmin && !isManager) {
            showToast({
                type: 'error',
                title: 'Permission Denied',
                message: 'Only admins and managers can import inventory'
            });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const fileText = await file.text();

            let productsData;
            if (fileExtension === 'json') {
                productsData = parseJSON(fileText);
            } else if (fileExtension === 'csv') {
                productsData = parseCSV(fileText);
            } else {
                throw new Error('Unsupported file format. Please use CSV or JSON.');
            }

            if (!productsData || productsData.length === 0) {
                throw new Error('File is empty or contains no valid data');
            }

            // Confirm import
            const confirmMessage = `Are you sure you want to import ${productsData.length} products?\n\n` +
                'Options:\n' +
                '- Click OK to skip duplicates\n' +
                '- Click Cancel to abort';
            
            if (!window.confirm(confirmMessage)) {
                return;
            }

            // Show update option
            const updateExisting = window.confirm(
                'Do you want to update existing products if they are found?\n\n' +
                'Click OK to update existing products\n' +
                'Click Cancel to skip duplicates'
            );

            const result = await bulkImportProducts(productsData, {
                skipDuplicates: true,
                updateExisting: updateExisting
            });

            // Show results
            let message = `Import completed!\n\n` +
                `✓ Successfully imported/updated: ${result.success}\n` +
                `✗ Failed: ${result.failed}\n` +
                `⊘ Skipped: ${result.skipped}`;

            if (result.errors.length > 0 && result.errors.length <= 10) {
                message += '\n\nErrors:\n' + result.errors
                    .slice(0, 10)
                    .map(e => `- ${e.product || 'Row ' + e.row}: ${e.error}`)
                    .join('\n');
            } else if (result.errors.length > 10) {
                message += `\n\n(${result.errors.length} errors - check console for details)`;
            }

            showToast({
                type: result.failed === 0 ? 'success' : 'warning',
                title: 'Import Complete',
                message: message
            });

            // Reload inventory
            if (result.success > 0) {
                await loadData();
            }

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            console.error('Error importing inventory:', err);
            showToast({
                type: 'error',
                title: 'Import Failed',
                message: err.message || 'Failed to import inventory'
            });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="inventory-container">
            <div className="inventory-header">
                <h1>Inventory Management</h1>
                <div className="header-actions">
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleImportClick}
                        disabled={isImporting || loading}
                        title="Import inventory from CSV or JSON file"
                    >
                        <Upload size={18} style={{ marginRight: '8px' }} />
                        {isImporting ? 'Importing...' : 'Import'}
                    </button>
                    <div className="export-dropdown">
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => handleExportInventory('csv')}
                            disabled={isExporting || loading}
                            title="Export inventory to CSV"
                        >
                            <Download size={18} style={{ marginRight: '8px' }} />
                            {isExporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => handleExportInventory('json')}
                            disabled={isExporting || loading}
                            title="Export inventory to JSON"
                            style={{ marginLeft: '8px' }}
                        >
                            <Download size={18} style={{ marginRight: '8px' }} />
                            {isExporting ? 'Exporting...' : 'Export JSON'}
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={handleAddClick}>
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        Add Product
                    </button>
                </div>
            </div>
            
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileImport}
                style={{ display: 'none' }}
            />

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

            {/* Inventory Summary Card */}
            <div className="inventory-summary">
                <div className="summary-card">
                    <div className="summary-item">
                        <div className="summary-label">Total Retail Value</div>
                        <div className="summary-value retail-value">
                            GHS {totalRetailValue.toFixed(2)}
                        </div>
                        <div className="summary-description">Value at selling price</div>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-item">
                        <div className="summary-label">Total Cost Value</div>
                        <div className="summary-value cost-value">
                            GHS {totalCostValue.toFixed(2)}
                        </div>
                        <div className="summary-description">Value at purchase price</div>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-item">
                        <div className="summary-label">Potential Profit</div>
                        <div className="summary-value profit-value">
                            GHS {(totalRetailValue - totalCostValue).toFixed(2)}
                        </div>
                        <div className="summary-description">Retail - Cost</div>
                    </div>
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
