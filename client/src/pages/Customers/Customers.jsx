import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, User, DollarSign } from 'lucide-react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, recordCustomerPayment, getCustomerCreditSales } from '../../services/customerService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import CustomerFormModal from './CustomerFormModal';
import CustomerPaymentModal from './CustomerPaymentModal';
import './Customers.css';

const Customers = () => {
    const { showToast } = useNotification();
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (err) {
            console.error('Error loading customers:', err);
            setError(err.message || 'Failed to load customers');
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to load customers'
            });
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                const result = await deleteCustomer(id);
                if (result.success) {
                    showToast({
                        type: 'success',
                        title: 'Success',
                        message: 'Customer deleted successfully'
                    });
                    loadData();
                } else {
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: result.error || 'Failed to delete customer'
                    });
                }
            } catch (err) {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: err.message || 'Failed to delete customer'
                });
            }
        }
    };

    const handleAddClick = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            let result;
            if (editingCustomer) {
                result = await updateCustomer(editingCustomer.id, formData);
            } else {
                result = await addCustomer(formData);
            }

            if (result.success) {
                showToast({
                    type: 'success',
                    title: 'Success',
                    message: editingCustomer ? 'Customer updated successfully' : 'Customer added successfully'
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

    const handlePaymentClick = async (customer) => {
        try {
            // Load customer's credit sales to show in payment modal
            const creditSales = await getCustomerCreditSales(customer.id);
            setSelectedCustomerForPayment({
                ...customer,
                creditSales: creditSales
            });
            setIsPaymentModalOpen(true);
        } catch (err) {
            showToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to load customer credit sales'
            });
        }
    };

    const handlePaymentSubmit = async (paymentData) => {
        try {
            const paymentRecord = {
                customer_id: selectedCustomerForPayment.id,
                amount: parseFloat(paymentData.amount),
                payment_method: paymentData.payment_method,
                sale_id: paymentData.sale_id || null,
                reference_number: paymentData.reference_number || null,
                notes: paymentData.notes || null,
                created_by: user?.id || null
            };

            const result = await recordCustomerPayment(paymentRecord);

            if (result.success) {
                showToast({
                    type: 'success',
                    title: 'Success',
                    message: `Payment of GHS ${paymentData.amount} recorded successfully`
                });
                setIsPaymentModalOpen(false);
                setSelectedCustomerForPayment(null);
                loadData(); // Refresh customer list to show updated balance
            } else {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: result.error || 'Failed to record payment'
                });
            }
        } catch (err) {
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to record payment'
            });
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );

    return (
        <div className="customers-container">
            <div className="customers-header">
                <h1>Customer Management</h1>
                <button className="btn btn-primary" onClick={handleAddClick}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Add Customer
                </button>
            </div>

            <div className="customers-controls">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="customers-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Credit Limit</th>
                            <th>Balance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center">Loading...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="6" className="text-center error-text">{error}</td></tr>
                        ) : filteredCustomers.length === 0 ? (
                            <tr><td colSpan="6" className="text-center">No customers found</td></tr>
                        ) : (
                            filteredCustomers.map(customer => (
                                <tr key={customer.id}>
                                    <td>
                                        <div className="customer-cell">
                                            <div className="avatar-sm">
                                                <User size={16} />
                                            </div>
                                            <span>{customer.name}</span>
                                        </div>
                                    </td>
                                    <td>{customer.phone}</td>
                                    <td>{customer.email || '-'}</td>
                                    <td>GHS {customer.credit_limit?.toFixed(2)}</td>
                                    <td>
                                        <span className={`balance-badge ${customer.outstanding_balance > 0 ? 'owing' : 'clear'}`}>
                                            GHS {customer.outstanding_balance?.toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {customer.outstanding_balance > 0 && (
                                                <button 
                                                    className="icon-btn payment" 
                                                    title="Record Payment" 
                                                    onClick={() => handlePaymentClick(customer)}
                                                    style={{ color: '#10b981' }}
                                                >
                                                    <DollarSign size={18} />
                                                </button>
                                            )}
                                            <button className="icon-btn edit" title="Edit" onClick={() => handleEditClick(customer)}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(customer.id)}>
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

            <CustomerFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingCustomer}
            />

            <CustomerPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedCustomerForPayment(null);
                }}
                onSubmit={handlePaymentSubmit}
                customer={selectedCustomerForPayment}
            />
        </div>
    );
};

export default Customers;
