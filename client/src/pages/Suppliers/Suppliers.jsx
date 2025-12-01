import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Truck } from 'lucide-react';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../../services/supplierService';
import { useNotification } from '../../context/NotificationContext';
import SupplierFormModal from './SupplierFormModal';
import './Suppliers.css';

const Suppliers = () => {
    const { showToast } = useNotification();
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (err) {
            console.error('Error loading suppliers:', err);
            setError(err.message || 'Failed to load suppliers');
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to load suppliers'
            });
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            try {
                const result = await deleteSupplier(id);
                if (result.success) {
                    showToast({
                        type: 'success',
                        title: 'Success',
                        message: 'Supplier deleted successfully'
                    });
                    loadData();
                } else {
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: result.error || 'Failed to delete supplier'
                    });
                }
            } catch (err) {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: err.message || 'Failed to delete supplier'
                });
            }
        }
    };

    const handleAddClick = () => {
        setEditingSupplier(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            let result;
            if (editingSupplier) {
                result = await updateSupplier(editingSupplier.id, formData);
            } else {
                result = await addSupplier(formData);
            }

            if (result.success) {
                showToast({
                    type: 'success',
                    title: 'Success',
                    message: editingSupplier ? 'Supplier updated successfully' : 'Supplier added successfully'
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

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="suppliers-container">
            <div className="suppliers-header">
                <h1>Supplier Management</h1>
                <button className="btn btn-primary" onClick={handleAddClick}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Add Supplier
                </button>
            </div>

            <div className="suppliers-controls">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="suppliers-table">
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th>Contact Person</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Address</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center">Loading...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="6" className="text-center error-text">{error}</td></tr>
                        ) : filteredSuppliers.length === 0 ? (
                            <tr><td colSpan="6" className="text-center">No suppliers found</td></tr>
                        ) : (
                            filteredSuppliers.map(supplier => (
                                <tr key={supplier.id}>
                                    <td>
                                        <div className="supplier-cell">
                                            <div className="avatar-sm">
                                                <Truck size={16} />
                                            </div>
                                            <span>{supplier.name}</span>
                                        </div>
                                    </td>
                                    <td>{supplier.contact_person || '-'}</td>
                                    <td>{supplier.phone}</td>
                                    <td>{supplier.email || '-'}</td>
                                    <td>{supplier.address || '-'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="icon-btn edit" title="Edit" onClick={() => handleEditClick(supplier)}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(supplier.id)}>
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

            <SupplierFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingSupplier}
            />
        </div>
    );
};

export default Suppliers;
