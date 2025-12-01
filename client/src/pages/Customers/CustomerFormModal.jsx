import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './CustomerFormModal.css';

const CustomerFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        credit_limit: '',
        outstanding_balance: '0'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                credit_limit: initialData.credit_limit || '',
                outstanding_balance: initialData.outstanding_balance || '0'
            });
        } else {
            setFormData({
                name: '',
                phone: '',
                email: '',
                credit_limit: '',
                outstanding_balance: '0'
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            credit_limit: parseFloat(formData.credit_limit || 0),
            outstanding_balance: parseFloat(formData.outstanding_balance || 0),
            is_active: true
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{initialData ? 'Edit Customer' : 'Add New Customer'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="customer-form">
                    <div className="form-group">
                        <label>Full Name</label>
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
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email (Optional)</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Credit Limit (GHS)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="credit_limit"
                                value={formData.credit_limit}
                                onChange={handleChange}
                            />
                        </div>
                        {initialData && (
                            <div className="form-group">
                                <label>Outstanding Balance (GHS)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="outstanding_balance"
                                    value={formData.outstanding_balance}
                                    onChange={handleChange}
                                    disabled // Usually shouldn't edit balance directly here
                                />
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Customer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerFormModal;
