import { supabase } from '../lib/supabaseClient';

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
        return { success: true, data };
    } catch (error) {
        console.error('Error adding product:', error.message);
        return { success: false, error: error.message };
    }
};

export const updateProduct = async (id, productData) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error updating product:', error.message);
        return { success: false, error: error.message };
    }
};

export const deleteProduct = async (id) => {
    try {
        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
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
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .eq('barcode', barcode)
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
