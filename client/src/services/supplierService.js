import { supabase } from '../lib/supabaseClient';

export const getSuppliers = async () => {
    try {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        
        // Return empty array if no data
        return data || [];
    } catch (error) {
        console.error('Error fetching suppliers:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

export const addSupplier = async (supplierData) => {
    try {
        const { data, error } = await supabase
            .from('suppliers')
            .insert([supplierData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error adding supplier:', error.message);
        return { success: false, error: error.message };
    }
};

export const updateSupplier = async (id, supplierData) => {
    try {
        const { data, error } = await supabase
            .from('suppliers')
            .update(supplierData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error updating supplier:', error.message);
        return { success: false, error: error.message };
    }
};

export const deleteSupplier = async (id) => {
    try {
        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('suppliers')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting supplier:', error.message);
        return { success: false, error: error.message };
    }
};
