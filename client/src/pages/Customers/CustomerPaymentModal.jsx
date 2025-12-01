import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './CustomerPaymentModal.css';

const CustomerPaymentModal = ({ isOpen, onClose, onSubmit, customer }) => {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amount, setAmount] = useState('');
    const [selectedSaleId, setSelectedSaleId] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen && customer) {
            // Set default amount to outstanding balance
            setAmount(customer.outstanding_balance?.toFixed(2) || '0.00');
            setSelectedSaleId('');
            setReferenceNumber('');
            setNotes('');
            setPaymentMethod('cash');
        }
    }, [isOpen, customer]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        if (paymentAmount > customer.outstanding_balance) {
            if (!window.confirm(`Payment amount (GHS ${paymentAmount.toFixed(2)}) exceeds outstanding balance (GHS ${customer.outstanding_balance.toFixed(2)}). Continue anyway?`)) {
                return;
            }
        }

        onSubmit({
            amount: paymentAmount,
            payment_method: paymentMethod,
            sale_id: selectedSaleId || null,
            reference_number: referenceNumber || null,
            notes: notes || null
        });
    };

    if (!isOpen || !customer) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content customer-payment-modal">
                <div className="modal-header">
                    <h2>Record Payment - {customer.name}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="payment-form">
                    <div className="customer-info">
                        <div className="info-row">
                            <span>Outstanding Balance:</span>
                            <span className="balance-amount">GHS {customer.outstanding_balance?.toFixed(2) || '0.00'}</span>
                        </div>
                        {customer.credit_limit > 0 && (
                            <div className="info-row">
                                <span>Credit Limit:</span>
                                <span>GHS {customer.credit_limit.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Payment Amount *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            placeholder="Enter payment amount"
                        />
                    </div>

                    <div className="form-group">
                        <label>Payment Method *</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            required
                        >
                            <option value="cash">Cash</option>
                            <option value="momo">Mobile Money</option>
                            <option value="card">Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>

                    {customer.creditSales && customer.creditSales.length > 0 && (
                        <div className="form-group">
                            <label>Apply to Sale (Optional)</label>
                            <select
                                value={selectedSaleId}
                                onChange={(e) => setSelectedSaleId(e.target.value)}
                            >
                                <option value="">-- General Payment --</option>
                                {customer.creditSales.map((sale) => (
                                    <option key={sale.id} value={sale.id}>
                                        {sale.sale_number} - Balance: GHS {sale.balance_due.toFixed(2)} (Total: GHS {sale.final_amount.toFixed(2)})
                                    </option>
                                ))}
                            </select>
                            <small className="form-hint">
                                Select a specific sale to apply this payment to, or leave as "General Payment" to reduce overall balance
                            </small>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Reference Number (Optional)</label>
                        <input
                            type="text"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            placeholder="Transaction reference, cheque number, etc."
                        />
                    </div>

                    <div className="form-group">
                        <label>Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                            placeholder="Additional notes about this payment..."
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Record Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerPaymentModal;

