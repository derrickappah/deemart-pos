import { supabase } from '../lib/supabaseClient';

export const getBranches = async () => {
    try {
        const { data, error } = await supabase
            .from('branches')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        
        // Return empty array if no data
        return data || [];
    } catch (error) {
        console.error('Error fetching branches:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

export const getBranchById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('branches')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error fetching branch:', error.message);
        throw error;
    }
};

