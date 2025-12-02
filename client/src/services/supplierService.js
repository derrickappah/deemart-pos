import { supabase } from '../lib/supabaseClient';
import { createActivityLog } from './logService';

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

        // Log the action
        await createActivityLog({
            actionType: 'supplier_create',
            entityType: 'supplier',
            entityId: data.id,
            description: `Supplier "${supplierData.name}" was created`,
            newValues: {
                name: supplierData.name,
                contact_person: supplierData.contact_person,
                phone: supplierData.phone,
                email: supplierData.email,
            },
        });

        return { success: true, data };
    } catch (error) {
        console.error('Error adding supplier:', error.message);
        return { success: false, error: error.message };
    }
};

export const updateSupplier = async (id, supplierData) => {
    try {
        // Get old supplier data for logging
        const { data: oldSupplier } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();

        const { data, error } = await supabase
            .from('suppliers')
            .update(supplierData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log the action
        if (oldSupplier) {
            await createActivityLog({
                actionType: 'supplier_update',
                entityType: 'supplier',
                entityId: id,
                description: `Supplier "${oldSupplier.name}" was updated`,
                oldValues: oldSupplier,
                newValues: supplierData,
            });
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error updating supplier:', error.message);
        return { success: false, error: error.message };
    }
};

export const deleteSupplier = async (id) => {
    try {
        // Get supplier info before deletion for logging
        const { data: supplier } = await supabase
            .from('suppliers')
            .select('name')
            .eq('id', id)
            .single();

        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('suppliers')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;

        // Log the action
        if (supplier) {
            await createActivityLog({
                actionType: 'supplier_delete',
                entityType: 'supplier',
                entityId: id,
                description: `Supplier "${supplier.name}" was deleted (soft delete)`,
                oldValues: { name: supplier.name, is_active: true },
                newValues: { is_active: false },
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting supplier:', error.message);
        return { success: false, error: error.message };
    }
};
