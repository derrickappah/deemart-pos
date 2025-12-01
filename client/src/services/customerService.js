import { supabase } from '../lib/supabaseClient';

export const getCustomers = async () => {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        
        // Return empty array if no data
        return data || [];
    } catch (error) {
        console.error('Error fetching customers:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

export const addCustomer = async (customerData) => {
    try {
        const { data, error } = await supabase
            .from('customers')
            .insert([customerData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error adding customer:', error.message);
        return { success: false, error: error.message };
    }
};

export const updateCustomer = async (id, customerData) => {
    try {
        const { data, error } = await supabase
            .from('customers')
            .update(customerData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error updating customer:', error.message);
        return { success: false, error: error.message };
    }
};

export const deleteCustomer = async (id) => {
    try {
        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('customers')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting customer:', error.message);
        return { success: false, error: error.message };
    }
};

export const recordCustomerPayment = async (paymentData) => {
    try {
        // paymentData = { customer_id, amount, payment_method, sale_id (optional), reference_number (optional), notes (optional) }
        const { data, error } = await supabase
            .from('customer_payments')
            .insert([paymentData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error recording customer payment:', error.message);
        return { success: false, error: error.message };
    }
};

export const getCustomerPayments = async (customerId) => {
    try {
        const { data, error } = await supabase
            .from('customer_payments')
            .select('*, sales(sale_number, final_amount)')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching customer payments:', error.message);
        throw error;
    }
};

export const getCustomerCreditSales = async (customerId) => {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('id, sale_number, final_amount, balance_due, amount_paid, created_at')
            .eq('customer_id', customerId)
            .eq('is_credit', true)
            .gt('balance_due', 0)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching customer credit sales:', error.message);
        throw error;
    }
};
