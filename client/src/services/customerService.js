import { supabase } from '../lib/supabaseClient';
import { createActivityLog } from './logService';

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

        // Log the action
        await createActivityLog({
            actionType: 'customer_create',
            entityType: 'customer',
            entityId: data.id,
            description: `Customer "${customerData.name}" was created`,
            newValues: {
                name: customerData.name,
                phone: customerData.phone,
                email: customerData.email,
                credit_limit: customerData.credit_limit,
            },
        });

        return { success: true, data };
    } catch (error) {
        console.error('Error adding customer:', error.message);
        return { success: false, error: error.message };
    }
};

export const updateCustomer = async (id, customerData) => {
    try {
        // Get old customer data for logging
        const { data: oldCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        const { data, error } = await supabase
            .from('customers')
            .update(customerData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log the action
        if (oldCustomer) {
            await createActivityLog({
                actionType: 'customer_update',
                entityType: 'customer',
                entityId: id,
                description: `Customer "${oldCustomer.name}" was updated`,
                oldValues: oldCustomer,
                newValues: customerData,
            });
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error updating customer:', error.message);
        return { success: false, error: error.message };
    }
};

export const deleteCustomer = async (id) => {
    try {
        // Get customer info before deletion for logging
        const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', id)
            .single();

        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('customers')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;

        // Log the action
        if (customer) {
            await createActivityLog({
                actionType: 'customer_delete',
                entityType: 'customer',
                entityId: id,
                description: `Customer "${customer.name}" was deleted (soft delete)`,
                oldValues: { name: customer.name, is_active: true },
                newValues: { is_active: false },
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting customer:', error.message);
        return { success: false, error: error.message };
    }
};

export const recordCustomerPayment = async (paymentData) => {
    try {
        // Get customer name for logging
        const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', paymentData.customer_id)
            .single();

        // paymentData = { customer_id, amount, payment_method, sale_id (optional), reference_number (optional), notes (optional) }
        const { data, error } = await supabase
            .from('customer_payments')
            .insert([paymentData])
            .select()
            .single();

        if (error) throw error;

        // Log the action
        await createActivityLog({
            actionType: 'payment_create',
            entityType: 'payment',
            entityId: data.id,
            description: `Payment of GHS ${paymentData.amount} recorded for customer "${customer?.name || paymentData.customer_id}" via ${paymentData.payment_method}`,
            newValues: {
                customer_id: paymentData.customer_id,
                amount: paymentData.amount,
                payment_method: paymentData.payment_method,
                sale_id: paymentData.sale_id,
            },
        });

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
