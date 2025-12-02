import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Helper function to get current stock from database
const getProductStock = async (productId) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', productId)
            .single();

        if (error) {
            console.error('Error fetching product stock:', error);
            return null;
        }

        return data?.stock_quantity ?? 0;
    } catch (error) {
        console.error('Error fetching product stock:', error);
        return null;
    }
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [stockErrors, setStockErrors] = useState({}); // Track stock errors per product

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

    const addToCart = async (product, onStockError = null) => {
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

        // Check stock availability
        const currentStock = await getProductStock(productId);
        if (currentStock === null) {
            // If we can't fetch stock, allow adding but log a warning
            console.warn('Could not fetch stock for product:', productId);
        } else {
            // Check if product is out of stock
            if (currentStock <= 0) {
                const errorMsg = `${product.name} is out of stock`;
                if (onStockError) {
                    onStockError(errorMsg);
                }
                setStockErrors(prev => ({ ...prev, [productId]: errorMsg }));
                return false; // Don't add to cart
            }

            // Check if adding would exceed available stock
            setCartItems(prev => {
                const existing = prev.find(item => item.id === productId);
                const currentQuantity = existing ? existing.quantity : 0;
                const newQuantity = currentQuantity + 1;

                if (newQuantity > currentStock) {
                    const errorMsg = `Only ${currentStock} ${product.name} available in stock`;
                    if (onStockError) {
                        onStockError(errorMsg);
                    }
                    setStockErrors(prev => ({ ...prev, [productId]: errorMsg }));
                    return prev; // Don't update cart
                }

                // Clear any previous stock error for this product
                setStockErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[productId];
                    return newErrors;
                });

                // Create product object with validated ID
                const validatedProduct = {
                    ...product,
                    id: productId,
                    stock: currentStock // Update with latest stock
                };

                if (existing) {
                    return prev.map(item =>
                        item.id === productId
                            ? { ...validatedProduct, quantity: newQuantity }
                            : item
                    );
                }
                return [...prev, { ...validatedProduct, quantity: 1 }];
            });
        }

        // If stock check passed or couldn't be fetched, proceed with adding
        if (currentStock === null) {
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
        }

        return true; // Successfully added
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = async (productId, delta, onStockError = null) => {
        // Get current stock
        const currentStock = await getProductStock(productId);
        
        setCartItems(prev => prev.map(item => {
            if (item.id === productId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                
                // Check stock availability if we have stock data
                if (currentStock !== null && newQuantity > currentStock) {
                    const errorMsg = `Only ${currentStock} ${item.name} available in stock`;
                    if (onStockError) {
                        onStockError(errorMsg);
                    }
                    setStockErrors(prev => ({ ...prev, [productId]: errorMsg }));
                    return item; // Don't update quantity
                }

                // Clear any previous stock error for this product
                setStockErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[productId];
                    return newErrors;
                });

                // Update stock in item if we have fresh data
                const updatedItem = { ...item, quantity: newQuantity };
                if (currentStock !== null) {
                    updatedItem.stock = currentStock;
                }
                return updatedItem;
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
            clearCart,
            stockErrors
        }}>
            {children}
        </CartContext.Provider>
    );
};
