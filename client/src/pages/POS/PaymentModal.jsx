import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { getCustomers } from '../../services/customerService';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, onSubmit, totalAmount, onSaleComplete }) => {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [customers, setCustomers] = useState([]);
    const [splitPayments, setSplitPayments] = useState([]);
    const [isSplitPayment, setIsSplitPayment] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadCustomers();
            setAmountTendered(totalAmount.toFixed(2));
        }
    }, [isOpen, totalAmount]);

    // Refresh customers when onSaleComplete changes (after credit sale)
    useEffect(() => {
        if (onSaleComplete && onSaleComplete > 0) {
            // Small delay to ensure database trigger has completed
            setTimeout(() => {
                loadCustomers();
            }, 500);
        }
    }, [onSaleComplete]);

    const loadCustomers = async () => {
        const data = await getCustomers();
        setCustomers(data);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (paymentMethod === 'credit' && !selectedCustomer) {
            alert('Please select a customer for credit sale');
            return;
        }

        // Validate customer_id if provided
        let validatedCustomerId = null;
        if (paymentMethod === 'credit' && selectedCustomer) {
            const customerIdStr = String(selectedCustomer).trim();
            // Check if it looks like a barcode (contains dashes, spaces, etc.)
            if (customerIdStr.includes('-') || customerIdStr.includes(' ') || !/^\d+$/.test(customerIdStr)) {
                console.error('Invalid customer_id in payment modal:', {
                    value: selectedCustomer,
                    stringValue: customerIdStr
                });
                alert(`Invalid customer ID: "${selectedCustomer}". Please select a valid customer.`);
                return;
            }
            validatedCustomerId = parseInt(customerIdStr, 10);
            if (isNaN(validatedCustomerId) || validatedCustomerId <= 0) {
                console.error('Customer ID is not a valid integer:', selectedCustomer);
                alert(`Invalid customer ID: "${selectedCustomer}". Please select a valid customer.`);
                return;
            }
        }

        const paymentData = {
            payment_method: paymentMethod,
            amount_tendered: parseFloat(amountTendered) || totalAmount,
            customer_id: validatedCustomerId,
            is_credit: paymentMethod === 'credit',
            split_payments: isSplitPayment ? splitPayments : null,
        };

        onSubmit(paymentData);
    };

    const addSplitPayment = () => {
        setSplitPayments([...splitPayments, { method: 'cash', amount: 0 }]);
    };

    const removeSplitPayment = (index) => {
        setSplitPayments(splitPayments.filter((_, i) => i !== index));
    };

    const updateSplitPayment = (index, field, value) => {
        const updated = [...splitPayments];
        updated[index][field] = value;
        setSplitPayments(updated);
    };

    const totalSplitAmount = splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const change = parseFloat(amountTendered) - totalAmount;
    const splitBalance = totalAmount - totalSplitAmount;

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content payment-modal">
                <div className="modal-header">
                    <h2>Process Payment</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="payment-form">
                    <div className="payment-summary">
                        <div className="summary-row">
                            <span>Total Amount:</span>
                            <span className="amount">GHS {totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            required
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="momo">Mobile Money</option>
                            <option value="credit">Credit (Customer Account)</option>
                        </select>
                    </div>

                    {paymentMethod === 'credit' && (
                        <div className="form-group">
                            <label>Select Customer</label>
                            <select
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                required
                            >
                                <option value="">-- Select Customer --</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name} - Balance: GHS {customer.outstanding_balance?.toFixed(2) || '0.00'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {paymentMethod === 'cash' && !isSplitPayment && (
                        <>
                            <div className="form-group">
                                <label>Amount Tendered</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amountTendered}
                                    onChange={(e) => setAmountTendered(e.target.value)}
                                    required
                                    min={totalAmount}
                                />
                            </div>

                            {change >= 0 && (
                                <div className="change-display">
                                    <span>Change:</span>
                                    <span className="change-amount">GHS {change.toFixed(2)}</span>
                                </div>
                            )}
                        </>
                    )}

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={isSplitPayment}
                                onChange={(e) => setIsSplitPayment(e.target.checked)}
                            />
                            <span>Split Payment</span>
                        </label>
                    </div>

                    {isSplitPayment && (
                        <div className="split-payments-section">
                            <div className="split-header">
                                <h3>Payment Methods</h3>
                                <button type="button" className="btn btn-sm" onClick={addSplitPayment}>
                                    <Plus size={16} /> Add Payment
                                </button>
                            </div>

                            {splitPayments.map((payment, index) => (
                                <div key={`split-${index}-${payment.method}-${payment.amount}`} className="split-payment-row">
                                    <select
                                        value={payment.method}
                                        onChange={(e) => updateSplitPayment(index, 'method', e.target.value)}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="momo">MoMo</option>
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Amount"
                                        value={payment.amount}
                                        onChange={(e) => updateSplitPayment(index, 'amount', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="icon-btn delete"
                                        onClick={() => removeSplitPayment(index)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            <div className="split-summary">
                                <div className="summary-row">
                                    <span>Total Paid:</span>
                                    <span>GHS {totalSplitAmount.toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Balance:</span>
                                    <span className={splitBalance > 0 ? 'text-danger' : 'text-success'}>
                                        GHS {splitBalance.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSplitPayment && splitBalance > 0}
                        >
                            Complete Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
