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
