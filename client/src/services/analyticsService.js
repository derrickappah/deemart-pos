import { supabase } from '../lib/supabaseClient';

// Get sales trend data
export const getSalesTrend = async (days = 7) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('sales')
            .select('created_at, final_amount')
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Group by date
        const groupedData = {};
        data.forEach(sale => {
            const date = new Date(sale.created_at).toISOString().split('T')[0];
            if (!groupedData[date]) {
                groupedData[date] = { date, sales: 0, orders: 0 };
            }
            groupedData[date].sales += parseFloat(sale.final_amount || 0);
            groupedData[date].orders += 1;
        });

        const result = Object.values(groupedData).map(item => ({
            ...item,
            sales: Math.round(item.sales * 100) / 100
        }));

        return result;
    } catch (error) {
        console.error('Error fetching sales trend:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

// Get top selling products
export const getTopProducts = async (limit = 10) => {
    try {
        const { data, error } = await supabase
            .from('sale_items')
            .select(`
        quantity,
        total_price,
        products (name),
        sales!inner (status)
      `)
            .eq('sales.status', 'completed')
            .order('quantity', { ascending: false })
            .limit(limit * 10); // Get more to aggregate properly

        if (error) throw error;

        // Aggregate by product
        const productMap = {};
        data.forEach(item => {
            const name = item.products?.name || 'Unknown';
            if (!productMap[name]) {
                productMap[name] = { name, quantity: 0, revenue: 0 };
            }
            productMap[name].quantity += item.quantity;
            productMap[name].revenue += parseFloat(item.total_price);
        });

        const result = Object.values(productMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, limit)
            .map(item => ({
                ...item,
                revenue: Math.round(item.revenue * 100) / 100
            }));

        return result;
    } catch (error) {
        console.error('Error fetching top products:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

// Get category distribution
export const getCategoryDistribution = async () => {
    try {
        const { data, error } = await supabase
            .from('sale_items')
            .select(`
        total_price,
        products (
          categories (name)
        ),
        sales!inner (status)
      `)
            .eq('sales.status', 'completed');

        if (error) throw error;

        // Aggregate by category
        const categoryMap = {};
        let total = 0;

        data.forEach(item => {
            const name = item.products?.categories?.name || 'Uncategorized';
            const value = parseFloat(item.total_price);
            if (!categoryMap[name]) {
                categoryMap[name] = 0;
            }
            categoryMap[name] += value;
            total += value;
        });

        const result = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100,
            percentage: total > 0 ? Math.round((value / total) * 100) : 0
        }));

        return result;
    } catch (error) {
        console.error('Error fetching category distribution:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

// Get revenue and profit data (monthly)
export const getRevenueProfitData = async (months = 6) => {
    try {
        const startDate = new Date();
        startDate.setMonth(startDate.getDate() - months);

        const { data, error } = await supabase
            .from('sales')
            .select('created_at, final_amount')
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Group by month
        const monthlyData = {};
        data.forEach(sale => {
            const month = new Date(sale.created_at).toISOString().substring(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = { month, revenue: 0, profit: 0 };
            }
            const revenue = parseFloat(sale.final_amount || 0);
            monthlyData[month].revenue += revenue;
            // Assume 30% profit margin for demo
            monthlyData[month].profit += revenue * 0.3;
        });

        const result = Object.values(monthlyData).map(item => ({
            ...item,
            revenue: Math.round(item.revenue * 100) / 100,
            profit: Math.round(item.profit * 100) / 100,
            margin: 30
        }));

        return result;
    } catch (error) {
        console.error('Error fetching revenue/profit data:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};
