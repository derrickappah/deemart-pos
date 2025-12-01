import React from 'react';
import './Receipt.css';

const Receipt = ({ sale, items, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    if (!sale) return null;

    const currentDate = new Date().toLocaleString();

    return (
        <div className="receipt-overlay">
            <div className="receipt-container">
                <div className="receipt-actions no-print">
                    <button className="btn btn-primary" onClick={handlePrint}>
                        Print Receipt
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>

                <div className="receipt-content">
                    <div className="receipt-header">
                        <h1>Dee Wholesale Mart</h1>
                        <p>Your One-Stop Shop</p>
                        <p>Accra, Ghana</p>
                        <p>Tel: +233 XX XXX XXXX</p>
                    </div>

                    <div className="receipt-divider"></div>

                    <div className="receipt-info">
                        <div className="info-row">
                            <span>Receipt #:</span>
                            <span>{sale.id?.substring(0, 8) || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span>Date:</span>
                            <span>{currentDate}</span>
                        </div>
                        <div className="info-row">
                            <span>Cashier:</span>
                            <span>{sale.cashier || 'Cashier'}</span>
                        </div>
                    </div>

                    <div className="receipt-divider"></div>

                    <div className="receipt-items">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={`${item.id || item.name}-${index}`}>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>GHS {item.price.toFixed(2)}</td>
                                        <td>GHS {(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="receipt-divider"></div>

                    <div className="receipt-totals">
                        <div className="total-row">
                            <span>Subtotal:</span>
                            <span>GHS {sale.total_amount.toFixed(2)}</span>
                        </div>
                        <div className="total-row">
                            <span>Tax (0%):</span>
                            <span>GHS 0.00</span>
                        </div>
                        <div className="total-row grand-total">
                            <span>TOTAL:</span>
                            <span>GHS {sale.total_amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="receipt-divider"></div>

                    <div className="receipt-payment">
                        <div className="info-row">
                            <span>Payment Method:</span>
                            <span className="capitalize">{sale.payment_method}</span>
                        </div>
                        {sale.amount_tendered && (
                            <>
                                <div className="info-row">
                                    <span>Amount Paid:</span>
                                    <span>GHS {sale.amount_tendered.toFixed(2)}</span>
                                </div>
                                <div className="info-row">
                                    <span>Change:</span>
                                    <span>GHS {(sale.amount_tendered - sale.total_amount).toFixed(2)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="receipt-footer">
                        <p>Thank you for your business!</p>
                        <p>Please come again</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Receipt;
