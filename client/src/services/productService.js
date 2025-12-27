import { supabase } from '../lib/supabaseClient';
import { createActivityLog } from './logService';

export const getProducts = async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;

        // Return empty array if no data
        if (!data || data.length === 0) return [];

        // Transform data to match UI expectations
        return data.map(p => {
            // Ensure ID is a valid integer - check for barcode-like strings
            const idStr = String(p.id);
            if (idStr.includes('-') || idStr.includes(' ') || !/^\d+$/.test(idStr.trim())) {
                console.error('Product has barcode-like ID in database:', {
                    id: p.id,
                    name: p.name,
                    barcode: p.barcode,
                    fullProduct: p
                });
                throw new Error(`Product "${p.name}" has invalid ID format: "${p.id}". Database may have corrupted data.`);
            }
            
            const productId = typeof p.id === 'string' ? parseInt(p.id.trim(), 10) : parseInt(p.id, 10);
            if (isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
                console.error('Invalid product ID in database:', p);
                throw new Error(`Product "${p.name}" has invalid ID: ${p.id}. Expected a positive integer.`);
            }
            
            return {
                id: productId, // Ensure ID is always a number
                name: p.name,
                barcode: p.barcode,
                price: p.retail_price,
                cost_price: p.cost_price,
                category: p.categories?.name || 'Uncategorized',
                category_id: p.category_id,
                image: p.image_url || 'https://via.placeholder.com/150',
                stock: p.stock_quantity,
                min_stock_level: p.min_stock_level
            };
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

export const getCategories = async () => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        
        // Return empty array if no data
        return data || [];
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

export const addProduct = async (productData) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;

        // Log the action
        await createActivityLog({
            actionType: 'product_create',
            entityType: 'product',
            entityId: data.id,
            description: `Product "${productData.name}" was created`,
            newValues: {
                name: productData.name,
                barcode: productData.barcode,
                retail_price: productData.retail_price,
                cost_price: productData.cost_price,
                stock_quantity: productData.stock_quantity,
                category_id: productData.category_id,
            },
        });

        return { success: true, data };
    } catch (error) {
        console.error('Error adding product:', error.message);
        return { success: false, error: error.message };
    }
};

export const updateProduct = async (id, productData) => {
    try {
        // First, validate the ID
        const productId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(productId) || productId <= 0) {
            throw new Error(`Invalid product ID: ${id}`);
        }

        // First, check if product exists and we can read it
        const { data: existingProduct, error: readError } = await supabase
            .from('products')
            .select('id, name')
            .eq('id', productId)
            .single();

        if (readError) {
            if (readError.code === 'PGRST116') {
                throw new Error(`Product with ID ${productId} not found`);
            }
            throw readError;
        }

        if (!existingProduct) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        console.log('Updating product:', { productId, productName: existingProduct.name, productData });

        // Get full product data before update for logging
        const { data: oldProductData } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        // Update the product
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', productId)
            .select();

        if (error) {
            console.error('Supabase update error:', error);
            // Check if it's a permission error
            if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
                throw new Error('You do not have permission to update products. Only admins and managers can update products.');
            }
            throw error;
        }

        // Check if any rows were updated
        if (!data || data.length === 0) {
            throw new Error(`Product with ID ${productId} could not be updated. You may not have permission to update products, or the product may have been deleted.`);
        }

        // Check if stock was updated
        const stockChanged = oldProductData && 
            productData.stock_quantity !== undefined && 
            oldProductData.stock_quantity !== productData.stock_quantity;

        // Log stock update separately if stock changed
        if (stockChanged) {
            await createActivityLog({
                actionType: 'stock_update',
                entityType: 'stock',
                entityId: productId,
                description: `Stock updated for "${existingProduct.name}": ${oldProductData.stock_quantity} → ${productData.stock_quantity}`,
                oldValues: { stock_quantity: oldProductData.stock_quantity },
                newValues: { stock_quantity: productData.stock_quantity },
            });
        }

        // Log general product update
        await createActivityLog({
            actionType: 'product_update',
            entityType: 'product',
            entityId: productId,
            description: `Product "${existingProduct.name}" was updated`,
            oldValues: oldProductData ? {
                name: oldProductData.name,
                retail_price: oldProductData.retail_price,
                cost_price: oldProductData.cost_price,
                category_id: oldProductData.category_id,
            } : {},
            newValues: productData,
        });

        // Return the first (and should be only) updated row
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating product:', error);
        return { success: false, error: error.message || 'Failed to update product' };
    }
};

export const deleteProduct = async (id) => {
    try {
        // Get product info before deletion for logging
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('name')
            .eq('id', id)
            .single();

        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;

        // Log the action
        if (product) {
            await createActivityLog({
                actionType: 'product_delete',
                entityType: 'product',
                entityId: id,
                description: `Product "${product.name}" was deleted (soft delete)`,
                oldValues: { name: product.name, is_active: true },
                newValues: { is_active: false },
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting product:', error.message);
        return { success: false, error: error.message };
    }
};

export const getLowStockItems = async (threshold = null) => {
    try {
        let query = supabase
            .from('products')
            .select('*')
            .eq('is_active', true);

        // Use min_stock_level if threshold not provided
        if (threshold === null) {
            // Filter where stock_quantity <= min_stock_level
            const { data, error } = await query;
            if (error) throw error;
            // Filter in JavaScript since Supabase doesn't support column comparison directly
            return (data || []).filter(p => p.stock_quantity <= (p.min_stock_level || 10));
        } else {
            query = query.lt('stock_quantity', threshold);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }
    } catch (error) {
        console.error('Error fetching low stock items:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

export const getProductByBarcode = async (barcode) => {
    try {
        // Trim and normalize barcode
        const normalizedBarcode = barcode.trim();
        
        if (!normalizedBarcode) {
            return null;
        }

        console.log('Searching for product by barcode:', normalizedBarcode);

        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .eq('barcode', normalizedBarcode)
            .eq('is_active', true)
            .single();

        if (error) {
            // If product not found, return null (not an error)
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        if (!data) return null;

        // Transform data to match UI expectations
        // Ensure ID is a valid integer - check for barcode-like strings
        const idStr = String(data.id);
        if (idStr.includes('-') || idStr.includes(' ') || !/^\d+$/.test(idStr.trim())) {
            console.error('Product has barcode-like ID from barcode search:', {
                id: data.id,
                name: data.name,
                barcode: data.barcode,
                fullProduct: data
            });
            throw new Error(`Product "${data.name}" has invalid ID format: "${data.id}". Database may have corrupted data.`);
        }
        
        const productId = typeof data.id === 'string' ? parseInt(data.id.trim(), 10) : parseInt(data.id, 10);
        if (isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
            console.error('Invalid product ID from barcode search:', data);
            throw new Error(`Product found but has invalid ID: ${data.id}. Expected a positive integer.`);
        }
        
        return {
            id: productId, // Ensure ID is always a number
            name: data.name,
            barcode: data.barcode,
            price: data.retail_price,
            category: data.categories?.name || 'Uncategorized',
            image: data.image_url || 'https://via.placeholder.com/150',
            stock: data.stock_quantity
        };
    } catch (error) {
        console.error('Error fetching product by barcode:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

export const getProductByName = async (name) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .ilike('name', `%${name}%`)
            .eq('is_active', true)
            .limit(1)
            .single();

        if (error) {
            // If product not found, return null (not an error)
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        if (!data) return null;

        // Transform data to match UI expectations
        // Ensure ID is a valid integer - check for barcode-like strings
        const idStr = String(data.id);
        if (idStr.includes('-') || idStr.includes(' ') || !/^\d+$/.test(idStr.trim())) {
            console.error('Product has barcode-like ID from barcode search:', {
                id: data.id,
                name: data.name,
                barcode: data.barcode,
                fullProduct: data
            });
            throw new Error(`Product "${data.name}" has invalid ID format: "${data.id}". Database may have corrupted data.`);
        }
        
        const productId = typeof data.id === 'string' ? parseInt(data.id.trim(), 10) : parseInt(data.id, 10);
        if (isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
            console.error('Invalid product ID from barcode search:', data);
            throw new Error(`Product found but has invalid ID: ${data.id}. Expected a positive integer.`);
        }
        
        return {
            id: productId, // Ensure ID is always a number
            name: data.name,
            barcode: data.barcode,
            price: data.retail_price,
            category: data.categories?.name || 'Uncategorized',
            image: data.image_url || 'https://via.placeholder.com/150',
            stock: data.stock_quantity
        };
    } catch (error) {
        console.error('Error fetching product by name:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

export const searchProductsByName = async (name, limit = 10) => {
    try {
        if (!name || name.trim().length < 2) {
            return [];
        }

        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .ilike('name', `%${name}%`)
            .eq('is_active', true)
            .limit(limit)
            .order('name', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) return [];

        // Transform data to match UI expectations
        return data.map(p => {
            // Ensure ID is a valid integer
            const productId = typeof p.id === 'string' ? parseInt(p.id, 10) : p.id;
            if (isNaN(productId) || productId <= 0) {
                console.error('Invalid product ID in search results:', p);
                // Skip invalid products rather than throwing
                return null;
            }
            
            return {
                id: productId, // Ensure ID is always a number
                name: p.name,
                barcode: p.barcode,
                price: p.retail_price,
                category: p.categories?.name || 'Uncategorized',
                image: p.image_url || 'https://via.placeholder.com/150',
                stock: p.stock_quantity
            };
        }).filter(p => p !== null); // Remove any invalid products
    } catch (error) {
        console.error('Error searching products by name:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

// Get all products with full details for export
export const getAllProductsForExport = async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .order('name', { ascending: true });

        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            name: p.name,
            barcode: p.barcode || '',
            sku: p.sku || '',
            category: p.categories?.name || 'Uncategorized',
            category_id: p.category_id || '',
            cost_price: p.cost_price || 0,
            retail_price: p.retail_price || 0,
            wholesale_price: p.wholesale_price || 0,
            stock_quantity: p.stock_quantity || 0,
            min_stock_level: p.min_stock_level || 10,
            max_stock_level: p.max_stock_level || '',
            image_url: p.image_url || '',
            expiry_date: p.expiry_date || '',
            supplier_id: p.supplier_id || '',
            is_active: p.is_active !== false
        }));
    } catch (error) {
        console.error('Error fetching products for export:', error.message);
        throw error;
    }
};

// Bulk import products
export const bulkImportProducts = async (productsData, options = {}) => {
    const { skipDuplicates = true, updateExisting = false } = options;
    const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: []
    };

    try {
        // Get all existing products to check for duplicates
        let existingProducts = { data: [] };
        if (skipDuplicates || updateExisting) {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, barcode, sku');
            if (error) throw error;
            existingProducts = { data: data || [] };
        }

        const existingMap = new Map();
        (existingProducts.data || []).forEach(p => {
            if (p.barcode) existingMap.set(p.barcode.toLowerCase(), p);
            if (p.sku) existingMap.set(`sku:${p.sku.toLowerCase()}`, p);
            existingMap.set(`name:${p.name.toLowerCase()}`, p);
        });

        // Get all categories to map category names to IDs
        const { data: categories } = await supabase
            .from('categories')
            .select('id, name');

        const categoryMap = new Map();
        (categories || []).forEach(cat => {
            categoryMap.set(cat.name.toLowerCase(), cat.id);
        });

        // Process products in batches
        const batchSize = 50;
        for (let i = 0; i < productsData.length; i += batchSize) {
            const batch = productsData.slice(i, i + batchSize);
            const productsToInsert = [];
            const productsToUpdate = [];

            for (const product of batch) {
                try {
                    // Normalize and validate product data
                    const normalizedProduct = {
                        name: (product.name || product.Name || '').trim(),
                        barcode: (product.barcode || product.Barcode || '').trim() || null,
                        sku: (product.sku || product.SKU || '').trim() || null,
                        retail_price: parseFloat(product.retail_price || product['Retail Price'] || product.price || product.Price || 0) || 0,
                        cost_price: parseFloat(product.cost_price || product['Cost Price'] || 0) || 0,
                        wholesale_price: product.wholesale_price || product['Wholesale Price'] ? parseFloat(product.wholesale_price || product['Wholesale Price'] || 0) : null,
                        stock_quantity: parseInt(product.stock_quantity || product['Stock Quantity'] || product.stock || product.Stock || 0, 10) || 0,
                        min_stock_level: parseInt(product.min_stock_level || product['Min Stock Level'] || 10, 10) || 10,
                        max_stock_level: product.max_stock_level || product['Max Stock Level'] ? parseInt(product.max_stock_level || product['Max Stock Level'] || 0, 10) : null,
                        image_url: (product.image_url || product['Image URL'] || '').trim() || null,
                        expiry_date: product.expiry_date || product['Expiry Date'] || null,
                        supplier_id: product.supplier_id || product['Supplier ID'] ? parseInt(product.supplier_id || product['Supplier ID'] || 0, 10) : null,
                        is_active: product.is_active !== undefined ? product.is_active : true
                    };

                    // Validate required fields
                    if (!normalizedProduct.name) {
                        results.failed++;
                        results.errors.push({ row: i + 1, error: 'Product name is required' });
                        continue;
                    }

                    // Handle category
                    const categoryName = (product.category || product.Category || '').trim();
                    if (categoryName) {
                        const categoryId = categoryMap.get(categoryName.toLowerCase());
                        if (categoryId) {
                            normalizedProduct.category_id = categoryId;
                        } else {
                            // Category not found - could create it or leave null
                            normalizedProduct.category_id = null;
                        }
                    }

                    // Check for duplicates
                    const barcodeKey = normalizedProduct.barcode ? normalizedProduct.barcode.toLowerCase() : null;
                    const skuKey = normalizedProduct.sku ? `sku:${normalizedProduct.sku.toLowerCase()}` : null;
                    const nameKey = `name:${normalizedProduct.name.toLowerCase()}`;
                    
                    const existing = existingMap.get(barcodeKey) || 
                                   existingMap.get(skuKey) || 
                                   existingMap.get(nameKey);

                    if (existing) {
                        if (updateExisting) {
                            // Update existing product
                            productsToUpdate.push({ id: existing.id, ...normalizedProduct });
                        } else {
                            results.skipped++;
                            results.errors.push({ 
                                row: i + 1, 
                                product: normalizedProduct.name,
                                error: 'Product already exists (duplicate)' 
                            });
                            continue;
                        }
                    } else {
                        productsToInsert.push(normalizedProduct);
                    }
                } catch (err) {
                    results.failed++;
                    results.errors.push({ 
                        row: i + 1, 
                        product: product.name || 'Unknown',
                        error: err.message || 'Invalid product data' 
                    });
                }
            }

            // Insert new products
            if (productsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('products')
                    .insert(productsToInsert);

                if (insertError) {
                    results.failed += productsToInsert.length;
                    results.errors.push({ 
                        error: `Batch insert failed: ${insertError.message}` 
                    });
                } else {
                    results.success += productsToInsert.length;
                    
                    // Log bulk import
                    await createActivityLog({
                        actionType: 'bulk_import',
                        entityType: 'product',
                        description: `Bulk imported ${productsToInsert.length} products`,
                        newValues: { count: productsToInsert.length }
                    });
                }
            }

            // Update existing products
            if (productsToUpdate.length > 0) {
                for (const product of productsToUpdate) {
                    const { id, ...updateData } = product;
                    const result = await updateProduct(id, updateData);
                    if (result.success) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push({ 
                            product: product.name,
                            error: result.error || 'Update failed' 
                        });
                    }
                }
            }
        }

        return results;
    } catch (error) {
        console.error('Error in bulk import:', error);
        throw error;
    }
};