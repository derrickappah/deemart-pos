import React, { useState, useEffect } from 'react';
import ProductGrid from './ProductGrid';
import CartPanel from './CartPanel';
import BarcodeScanner from '../../components/BarcodeScanner';
import { getProductByBarcode, getProductByName, searchProductsByName } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import './POS.css';

const POS = () => {
    const { addToCart, cartItems, clearCart } = useCart();
    const { showToast } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');

    // Clean cart on mount to remove any invalid items
    useEffect(() => {
        const hasInvalidItems = cartItems.some(item => {
            if (!item.id) return true;
            const idStr = String(item.id);
            return idStr.includes('-') || idStr.includes(' ') || !/^\d+$/.test(idStr.trim());
        });
        
        if (hasInvalidItems) {
            console.warn('Found invalid items in cart on POS mount, clearing cart');
            clearCart();
            showToast({
                type: 'warning',
                title: 'Cart Cleared',
                message: 'Cart contained invalid items and has been cleared. Please add products again.'
            });
        }
    }, []); // Only run on mount

    // Helper function to check if input looks like a barcode (numeric or alphanumeric)
    const isBarcode = (input) => {
        // Barcodes are typically numeric or alphanumeric without spaces
        // If it's all numbers or alphanumeric without spaces, treat as barcode
        return /^[a-zA-Z0-9]+$/.test(input) && input.length >= 3;
    };

    const handleProductSearch = async (searchTerm) => {
        try {
            let product = null;
            const trimmedSearch = searchTerm.trim();

            // First try barcode search if it looks like a barcode
            if (isBarcode(trimmedSearch)) {
                product = await getProductByBarcode(trimmedSearch);
            }

            // If not found by barcode, try searching by name
            if (!product) {
                product = await getProductByName(trimmedSearch);
            }

            if (product) {
                if (product.stock <= 0) {
                    showToast({
                        type: 'warning',
                        title: 'Out of Stock',
                        message: `${product.name} is out of stock`
                    });
                    return false;
                }
                const added = await addToCart(product, (errorMsg) => {
                    showToast({
                        type: 'warning',
                        title: 'Insufficient Stock',
                        message: errorMsg
                    });
                });
                return added; // Product found and added (or stock error)
            }

            // Product not found
            showToast({
                type: 'warning',
                title: 'Product Not Found',
                message: `No product found matching: ${trimmedSearch}`
            });
            return false; // Product not found
        } catch (err) {
            console.error('Error searching for product:', err);
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to search for product'
            });
            return false;
        }
    };

    const handleProductSelect = async (product) => {
        if (product.stock <= 0) {
            showToast({
                type: 'warning',
                title: 'Out of Stock',
                message: `${product.name} is out of stock`
            });
            return;
        }
        await addToCart(product, (errorMsg) => {
            showToast({
                type: 'warning',
                title: 'Insufficient Stock',
                message: errorMsg
            });
        });
    };

    return (
        <div className="pos-container">
            <div className="pos-left">
                <BarcodeScanner
                    onProductFound={handleProductSearch}
                    onProductSelect={handleProductSelect}
                    onProductNotFound={(searchTerm) => console.log('Product not found:', searchTerm)}
                    searchProductsByName={searchProductsByName}
                    onSearchChange={setSearchTerm}
                />
                <ProductGrid searchTerm={searchTerm} />
            </div>
            <div className="pos-right">
                <CartPanel />
            </div>
        </div>
    );
};

export default POS;
