import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const newTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setTotal(newTotal);
        
        // Validate cart items and remove any with invalid IDs
        const invalidItems = cartItems.filter(item => {
            if (!item.id) return true;
            const idStr = String(item.id);
            // Check if ID looks like a barcode (contains dashes, spaces, or non-numeric chars)
            if (idStr.includes('-') || idStr.includes(' ') || !/^\d+$/.test(idStr.trim())) {
                console.warn('Removing invalid cart item:', item);
                return true;
            }
            const productId = typeof item.id === 'string' ? parseInt(item.id.trim(), 10) : item.id;
            return isNaN(productId) || productId <= 0 || !Number.isInteger(productId);
        });
        
        if (invalidItems.length > 0) {
            console.warn('Found invalid items in cart, removing them:', invalidItems);
            setCartItems(prev => prev.filter(item => {
                const idStr = String(item.id || '');
                if (idStr.includes('-') || idStr.includes(' ') || !/^\d+$/.test(idStr.trim())) {
                    return false; // Remove invalid items
                }
                const productId = typeof item.id === 'string' ? parseInt(item.id.trim(), 10) : item.id;
                return !isNaN(productId) && productId > 0 && Number.isInteger(productId);
            }));
        }
    }, [cartItems]);

    const addToCart = (product) => {
        // Validate product has a valid numeric ID
        if (!product || !product.id) {
            console.error('Attempted to add invalid product to cart:', product);
            throw new Error('Cannot add product to cart: product is missing an ID');
        }

        // Check if ID looks like a barcode (contains dashes, letters, etc.)
        const idStr = String(product.id);
        if (idStr.includes('-') || idStr.includes(' ') || !/^\d+$/.test(idStr.trim())) {
            console.error('Attempted to add product with barcode as ID:', {
                product: product,
                id: product.id,
                barcode: product.barcode
            });
            throw new Error(`Cannot add "${product.name}" to cart: product ID "${product.id}" appears to be a barcode, not a numeric ID. This is a data error - please contact support.`);
        }

        // Ensure ID is numeric (not a barcode string)
        const productId = typeof product.id === 'string' 
            ? parseInt(product.id.trim(), 10) 
            : parseInt(product.id, 10);
        
        if (isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
            console.error('Attempted to add product with invalid ID:', product);
            throw new Error(`Cannot add "${product.name}" to cart: invalid product ID "${product.id}". Expected a numeric ID.`);
        }

        // Create product object with validated ID
        const validatedProduct = {
            ...product,
            id: productId
        };

        setCartItems(prev => {
            const existing = prev.find(item => item.id === validatedProduct.id);
            if (existing) {
                return prev.map(item =>
                    item.id === validatedProduct.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...validatedProduct, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === productId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            total,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
