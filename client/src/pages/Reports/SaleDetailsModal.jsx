import React from 'react';
import { X } from 'lucide-react';
import './SaleDetailsModal.css';

const SaleDetailsModal = ({ isOpen, onClose, sale }) => {
    if (!isOpen || !sale) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="sale-details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Sale Details</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Sale Information */}
                    <div className="sale-info-section">
                        <h3>Sale Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Sale Number:</span>
                                <span className="info-value">{sale.sale_number || `#${sale.id}`}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Date:</span>
                                <span className="info-value">{formatDate(sale.created_at)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Payment Method:</span>
                                <span className="info-value capitalize">{sale.payment_method}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Status:</span>
                                <span className={`status-badge ${sale.status === 'completed' ? 'completed' : sale.status}`}>
                                    {sale.status}
                                </span>
                            </div>
                            {sale.customers && (
                                <div className="info-item">
                                    <span className="info-label">Customer:</span>
                                    <span className="info-value">
                                        {sale.customers.name} {sale.customers.phone && `(${sale.customers.phone})`}
                                    </span>
                                </div>
                            )}
                            {sale.is_credit && (
                                <div className="info-item">
                                    <span className="info-label">Credit Sale:</span>
                                    <span className="info-value">Yes</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Purchased */}
                    <div className="items-section">
                        <h3>Items Purchased</h3>
                        {sale.sale_items && sale.sale_items.length > 0 ? (
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Discount</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.sale_items.map((item) => (
                                        <tr key={`${sale.id}-${item.product_id}-${item.id || Math.random()}`}>
                                            <td>{item.products?.name || 'Unknown Product'}</td>
                                            <td>{item.quantity}</td>
                                            <td>GHS {item.unit_price.toFixed(2)}</td>
                                            <td>
                                                {item.discount_amount > 0 && (
                                                    <span className="discount-badge">
                                                        GHS {item.discount_amount.toFixed(2)}
                                                    </span>
                                                )}
                                                {item.discount_amount === 0 && '-'}
                                            </td>
                                            <td className="text-right">GHS {item.total_price.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-items">No items found for this sale.</p>
                        )}
                    </div>

                    {/* Totals */}
                    <div className="totals-section">
                        <div className="totals-row">
                            <span>Subtotal:</span>
                            <span>GHS {(sale.total_amount || 0).toFixed(2)}</span>
                        </div>
                        {sale.discount_amount > 0 && (
                            <div className="totals-row">
                                <span>Discount:</span>
                                <span className="discount">-GHS {sale.discount_amount.toFixed(2)}</span>
                            </div>
                        )}
                        {sale.tax_amount > 0 && (
                            <div className="totals-row">
                                <span>Tax:</span>
                                <span>GHS {sale.tax_amount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="totals-row total">
                            <span>Total Amount:</span>
                            <span>GHS {(sale.final_amount || sale.total_amount || 0).toFixed(2)}</span>
                        </div>
                        {sale.is_credit && (
                            <>
                                <div className="totals-row">
                                    <span>Amount Paid:</span>
                                    <span>GHS {(sale.amount_paid || 0).toFixed(2)}</span>
                                </div>
                                <div className="totals-row">
                                    <span>Balance Due:</span>
                                    <span className="balance-due">GHS {(sale.balance_due || 0).toFixed(2)}</span>
                                </div>
                            </>
                        )}
                        {sale.change_amount > 0 && (
                            <div className="totals-row">
                                <span>Change:</span>
                                <span>GHS {sale.change_amount.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaleDetailsModal;

