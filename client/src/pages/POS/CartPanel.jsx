import React, { useState } from 'react';
import { Trash2, Minus, Plus, CreditCard, PauseCircle, Percent } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { createSale } from '../../services/salesService';
import { supabase } from '../../lib/supabaseClient';
import PaymentModal from './PaymentModal';
import Receipt from '../../components/Receipt';

const CartPanel = () => {
    const { cartItems, total, removeFromCart, updateQuantity, clearCart, stockErrors } = useCart();
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [processing, setProcessing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState(null);
    const [receiptItems, setReceiptItems] = useState([]);
    const [saleCompleteTrigger, setSaleCompleteTrigger] = useState(0);

    const handlePaymentClick = () => {
        if (cartItems.length === 0) return;
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async (paymentData) => {
        setProcessing(true);
        setShowPaymentModal(false);

        // Calculate totals
        const subtotal = total;
        const discountAmount = 0; // Can be added later
        const taxAmount = 0; // Can be added later
        const finalAmount = subtotal - discountAmount + taxAmount;
        
        // Validate cart items before creating sale
        console.log('Validating cart items before sale:', cartItems);
        
        // Validate IDs and check stock availability
        for (const item of cartItems) {
            if (!item.id) {
                console.error('Cart item missing ID:', item);
                throw new Error(`Cart item "${item.name}" is missing an ID.`);
            }
            
            // Check if ID is a barcode string (contains dashes, letters, etc.)
            const idStr = String(item.id);
            if (!/^\d+$/.test(idStr.trim())) {
                console.error('Invalid cart item detected:', {
                    item: item,
                    id: item.id,
                    idType: typeof item.id,
                    idString: idStr
                });
                throw new Error(`Cart item "${item.name}" has invalid ID: "${item.id}". This appears to be a barcode (contains non-numeric characters), not a product ID. Please remove this item from cart and add it again using the product grid.`);
            }
            
            // Ensure ID is numeric
            const numericId = parseInt(idStr.trim(), 10);
            if (isNaN(numericId) || numericId <= 0) {
                console.error('Cart item ID is not a valid number:', item);
                throw new Error(`Cart item "${item.name}" has invalid ID: "${item.id}". Expected a positive number.`);
            }

            // Check stock availability
            const { data: product, error: stockError } = await supabase
                .from('products')
                .select('stock_quantity, name')
                .eq('id', numericId)
                .single();

            if (stockError) {
                console.error('Error checking stock for product:', stockError);
                throw new Error(`Failed to check stock for "${item.name}". Please try again.`);
            }

            if (!product) {
                throw new Error(`Product "${item.name}" not found in database.`);
            }

            if (product.stock_quantity < item.quantity) {
                throw new Error(`Insufficient stock for "${item.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
            }
        }

        const saleData = {
            cashier_id: user?.id || 'demo-user',
            total_amount: subtotal,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            payment_method: paymentData.payment_method,
            customer_id: paymentData.customer_id || null,
            is_credit: paymentData.is_credit || false,
            amount_paid: paymentData.is_credit ? 0 : (paymentData.amount_tendered || finalAmount),
            amount_tendered: paymentData.amount_tendered,
            balance_due: paymentData.is_credit ? finalAmount : 0,
            split_payments: paymentData.split_payments || null,
            items: cartItems.map((item, index) => {
                // Ensure product_id is a valid integer (not a barcode string)
                // Convert to string first to check for non-numeric characters
                const idStr = String(item.id).trim();
                
                // Check if string contains only digits (no dashes, letters, etc.)
                if (!/^\d+$/.test(idStr)) {
                    console.error('Invalid product ID in cart item:', {
                        item: item,
                        id: item.id,
                        idString: idStr,
                        index: index
                    });
                    throw new Error(`Invalid product ID for "${item.name}": "${item.id}" appears to be a barcode (contains non-numeric characters), not a product ID. Please remove this item from cart and add it again.`);
                }
                
                const productId = parseInt(idStr, 10);
                
                if (isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
                    console.error('Product ID is not a valid integer:', {
                        item: item,
                        id: item.id,
                        parsed: productId
                    });
                    throw new Error(`Invalid product ID for "${item.name}": "${item.id}". Expected a positive integer.`);
                }

                console.log(`Cart item ${index + 1} validated:`, {
                    name: item.name,
                    originalId: item.id,
                    productId: productId
                });

                return {
                    product_id: productId,
                    quantity: parseInt(item.quantity) || 1,
                    unit_price: parseFloat(item.price) || 0,
                    total_price: parseFloat(item.price * item.quantity) || 0,
                    discount_percent: 0,
                    discount_amount: 0
                };
            })
        };

        try {
            const result = await createSale(saleData);
            setProcessing(false);

            if (result.success) {
                // Save cart items for receipt before clearing
                const itemsForReceipt = [...cartItems];
                
                // Prepare receipt data
                const sale = result.sale || result.data;
                setLastSale({
                    id: sale?.id,
                    sale_number: sale?.sale_number,
                    total_amount: sale?.final_amount || total,
                    payment_method: paymentData.payment_method,
                    amount_tendered: paymentData.amount_tendered,
                    change_amount: sale?.change_amount || 0,
                    cashier: user?.full_name || user?.email || 'Cashier',
                });
                setReceiptItems(itemsForReceipt);
                setShowReceipt(true);
                clearCart();
                
                // Trigger customer data refresh if it was a credit sale
                if (paymentData.is_credit) {
                    setSaleCompleteTrigger(prev => prev + 1);
                }
                
                showToast({
                    type: 'success',
                    title: 'Success',
                    message: 'Sale completed successfully'
                });
            } else {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: result.error || 'Payment failed. Please try again.'
                });
            }
        } catch (err) {
            setProcessing(false);
            console.error('Error creating sale:', err);
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Payment failed. Please try again.'
            });
        }
    };

    const handleReceiptClose = () => {
        setShowReceipt(false);
        setLastSale(null);
        setReceiptItems([]);
    };

    return (
        <div className="cart-panel">
            <div className="cart-header">
                <h2>Current Sale</h2>
                <button className="clear-btn" onClick={clearCart} disabled={cartItems.length === 0}>
                    Clear
                </button>
            </div>

            <div className="cart-items">
                {cartItems.length === 0 ? (
                    <div className="empty-cart">
                        <p>Cart is empty</p>
                        <span>Scan barcode or select items</span>
                    </div>
                ) : (
                    cartItems.map(item => (
                        <div key={item.id} className="cart-item">
                            <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">GHS {item.price.toFixed(2)}</span>
                            </div>

                            <div className="item-controls">
                                <div className="qty-control">
                                    <button onClick={() => updateQuantity(item.id, -1, (errorMsg) => {
                                        showToast({
                                            type: 'warning',
                                            title: 'Insufficient Stock',
                                            message: errorMsg
                                        });
                                    })}>
                                        <Minus size={14} />
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1, (errorMsg) => {
                                        showToast({
                                            type: 'warning',
                                            title: 'Insufficient Stock',
                                            message: errorMsg
                                        });
                                    })}>
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="item-total">
                                    GHS {(item.price * item.quantity).toFixed(2)}
                                </div>
                                <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            {stockErrors[item.id] && (
                                <div className="stock-error">
                                    {stockErrors[item.id]}
                                </div>
                            )}
                            {item.stock !== undefined && (
                                <div className="stock-info">
                                    Stock: {item.stock} available
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="cart-footer">
                <div className="cart-summary">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>GHS {total.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Tax (0%)</span>
                        <span>GHS 0.00</span>
                    </div>
                    <div className="summary-row total">
                        <span>Total</span>
                        <span>GHS {total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="cart-actions">
                    <div className="action-row">
                        <button className="action-btn secondary">
                            <PauseCircle size={18} />
                            Hold
                        </button>
                        <button className="action-btn secondary">
                            <Percent size={18} />
                            Discount
                        </button>
                    </div>
                    <button
                        className="pay-btn"
                        disabled={cartItems.length === 0 || processing}
                        onClick={handlePaymentClick}
                    >
                        <CreditCard size={20} />
                        <span>{processing ? 'Processing...' : `Pay GHS ${total.toFixed(2)}`}</span>
                    </button>
                </div>
            </div>

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSubmit={handlePaymentSubmit}
                totalAmount={total}
                onSaleComplete={saleCompleteTrigger}
            />

            {showReceipt && (
                <Receipt
                    sale={lastSale}
                    items={receiptItems}
                    onClose={handleReceiptClose}
                />
            )}
        </div>
    );
};

export default CartPanel;
