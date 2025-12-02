import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scan, CheckCircle, XCircle } from 'lucide-react';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onProductFound, onProductSelect, onProductNotFound, searchProductsByName, onSearchChange }) => {
    const [barcode, setBarcode] = useState('');
    const [status, setStatus] = useState(null); // 'success' | 'error' | null
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        // Auto-focus the input on mount
        const focusInput = () => {
            if (inputRef.current && document.activeElement !== inputRef.current) {
                inputRef.current.focus();
            }
        };
        
        // Only focus on mount, not on every click
        focusInput();
        
        // Re-focus when clicking on the POS page (but not on modals or interactive elements)
        const handleClick = (e) => {
            const target = e.target;
            
            // Don't re-focus if clicking on:
            // - Modals or modal overlays
            // - Buttons, selects, inputs, or other form elements
            // - Links or interactive elements
            // - Elements with data-no-focus attribute
            if (
                target.closest('.modal-overlay') ||
                target.closest('.modal-content') ||
                target.closest('button') ||
                target.closest('select') ||
                target.closest('input') ||
                target.closest('textarea') ||
                target.closest('a') ||
                target.closest('[data-no-focus]') ||
                target.closest('.payment-modal') ||
                target.closest('.receipt-overlay')
            ) {
                return; // Don't re-focus
            }
            
            // Only re-focus if clicking on the POS page itself
            if (target.closest('.pos-container') || target.closest('.barcode-scanner')) {
                setTimeout(focusInput, 100);
            }
        };
        
        document.addEventListener('click', handleClick);
        
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, []);

    // Debounced search function
    const performSearch = useCallback(async (searchTerm) => {
        if (!searchTerm || searchTerm.trim().length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            if (searchProductsByName) {
                const results = await searchProductsByName(searchTerm.trim(), 10);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            console.error('Error searching products:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [searchProductsByName]);

    useEffect(() => {
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        const trimmedBarcode = barcode.trim();
        
        // Check if input looks like a barcode (long alphanumeric string without spaces)
        // If it does, don't trigger name search - wait for Enter key
        const looksLikeBarcode = /^[a-zA-Z0-9]+$/.test(trimmedBarcode) && 
                                trimmedBarcode.length >= 8 && 
                                !trimmedBarcode.includes(' ');

        // Only trigger name search if it doesn't look like a barcode
        if (!looksLikeBarcode && trimmedBarcode.length >= 2) {
            // Set new timeout for debounced search
            searchTimeoutRef.current = setTimeout(() => {
                performSearch(trimmedBarcode);
            }, 300); // 300ms debounce
        } else {
            // Clear search results for barcode-like input
            setSearchResults([]);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [barcode, performSearch]);

    const handleKeyPress = async (e) => {
        if (e.key === 'Enter' && barcode.trim()) {
            e.preventDefault();

            // Clear any pending search timeout since we're processing now
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
            }

            // If there are search results and one is selected, use that
            if (searchResults.length > 0 && selectedIndex >= 0 && selectedIndex < searchResults.length) {
                if (onProductSelect) {
                    onProductSelect(searchResults[selectedIndex]);
                    setBarcode('');
                    setSearchResults([]);
                    setSelectedIndex(-1);
                    setStatus('success');
                    setTimeout(() => setStatus(null), 2000);
                }
                return;
            }

            // Check if input looks like a barcode (numeric/alphanumeric, no spaces, typically 8+ chars)
            // Barcodes are usually longer and don't contain spaces
            const trimmedBarcode = barcode.trim();
            const looksLikeBarcode = /^[a-zA-Z0-9]+$/.test(trimmedBarcode) && 
                                    trimmedBarcode.length >= 3 && 
                                    !trimmedBarcode.includes(' ');

            console.log('Barcode scanner - Enter pressed:', {
                barcode: trimmedBarcode,
                looksLikeBarcode,
                searchResultsCount: searchResults.length
            });

            // If it looks like a barcode, prioritize barcode search over name search
            // Otherwise, try to find exact match (which will try barcode first, then name)
            const found = await onProductFound(trimmedBarcode);
            
            console.log('Barcode scanner - Product found:', found);

            if (found) {
                setStatus('success');
                setBarcode('');
                setSearchResults([]);
                setSelectedIndex(-1);
                if (onSearchChange) {
                    onSearchChange('');
                }
            } else {
                setStatus('error');
                if (onProductNotFound) {
                    onProductNotFound(trimmedBarcode);
                }
            }

            // Clear status after 2 seconds
            setTimeout(() => setStatus(null), 2000);
        } else if (e.key === 'ArrowDown' && searchResults.length > 0) {
            e.preventDefault();
            setSelectedIndex(prev => 
                prev < searchResults.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp' && searchResults.length > 0) {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Escape') {
            setSearchResults([]);
            setSelectedIndex(-1);
        }
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setBarcode(value);
        setStatus(null);
        setSelectedIndex(-1);
        
        // Notify parent component of search term change for filtering product grid
        if (onSearchChange) {
            onSearchChange(value);
        }

        // If the value looks like a barcode and is being entered quickly (scanner input),
        // don't trigger name search immediately - wait for Enter key
        // This helps distinguish between manual typing and barcode scanning
        const looksLikeBarcode = /^[a-zA-Z0-9]+$/.test(value.trim()) && 
                                value.trim().length >= 8 && 
                                !value.includes(' ');
        
        // Only trigger name search if it doesn't look like a barcode or is short
        if (!looksLikeBarcode && value.trim().length >= 2) {
            // Name search will be triggered by the debounced useEffect
        } else if (looksLikeBarcode) {
            // Clear search results for barcode-like input
            setSearchResults([]);
        }
    };

    const handleResultClick = (product) => {
        if (onProductSelect) {
            onProductSelect(product);
            setBarcode('');
            setSearchResults([]);
            setSelectedIndex(-1);
            setStatus('success');
            if (onSearchChange) {
                onSearchChange('');
            }
            setTimeout(() => setStatus(null), 2000);
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (resultsRef.current && !resultsRef.current.contains(event.target) && 
                inputRef.current && !inputRef.current.contains(event.target)) {
                setSearchResults([]);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="barcode-scanner">
            <div className="scanner-input-wrapper">
                <Scan size={20} className="scanner-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    value={barcode}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Scan barcode or search by product name..."
                    className={`scanner-input ${status ? `status-${status}` : ''}`}
                />
                {status === 'success' && (
                    <CheckCircle size={20} className="status-icon success" />
                )}
                {status === 'error' && (
                    <XCircle size={20} className="status-icon error" />
                )}
                {isSearching && (
                    <div className="search-loading">Searching...</div>
                )}
            </div>
            {status === 'error' && (
                <div className="scanner-error">
                    Product not found. Please check the barcode or product name.
                </div>
            )}
            {searchResults.length > 0 && (
                <div ref={resultsRef} className="search-results">
                    {searchResults.map((product, index) => (
                        <div
                            key={product.id}
                            className={`search-result-item ${index === selectedIndex ? 'selected' : ''} ${product.stock <= 0 ? 'out-of-stock' : ''}`}
                            onClick={() => handleResultClick(product)}
                        >
                            <div className="result-info">
                                <div className="result-name">{product.name}</div>
                                <div className="result-details">
                                    <span className="result-price">GHS {product.price.toFixed(2)}</span>
                                    {product.barcode && (
                                        <span className="result-barcode">Barcode: {product.barcode}</span>
                                    )}
                                </div>
                            </div>
                            {product.stock <= 0 && (
                                <div className="result-stock-badge">Out of Stock</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
