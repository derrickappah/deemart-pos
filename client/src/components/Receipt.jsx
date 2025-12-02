import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Receipt.css';

const Receipt = ({ sale, items, onClose }) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const [printContainer, setPrintContainer] = useState(null);

    useEffect(() => {
        // Create a container for print version
        const container = document.createElement('div');
        container.id = 'receipt-print-container';
        container.style.display = 'none';
        document.body.appendChild(container);
        setPrintContainer(container);

        return () => {
            // Cleanup
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        };
    }, []);

    useEffect(() => {
        const handleBeforePrint = () => {
            setIsPrinting(true);
            if (printContainer) {
                printContainer.style.display = 'block';
            }
        };

        const handleAfterPrint = () => {
            setIsPrinting(false);
            if (printContainer) {
                printContainer.style.display = 'none';
            }
        };

        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [printContainer]);

    const handlePrint = () => {
        window.print();
    };

    if (!sale) return null;

    const currentDate = new Date().toLocaleString();

    const receiptContent = (
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
    );

    const printReceipt = printContainer ? (
        createPortal(
            <div className="receipt-print-wrapper">
                <div className="receipt-container">
                    {receiptContent}
                </div>
            </div>,
            printContainer
        )
    ) : null;

    return (
        <>
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
                    {receiptContent}
                </div>
            </div>
            {printReceipt}
        </>
    );
};

export default Receipt;
