import React, { useState } from 'react';
import { Download, Database, RefreshCw } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { exportToCSV } from '../../utils/exportUtils';
import { getDailySalesSummary } from '../../services/salesService';
import { getCustomers } from '../../services/customerService';
import { supabase } from '../../lib/supabaseClient';

const DataManagement = () => {
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);

    const handleExportSales = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('sales')
                .select('*, customers(name), user_profiles(full_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const exportData = data.map(sale => ({
                Date: new Date(sale.created_at).toLocaleDateString(),
                Time: new Date(sale.created_at).toLocaleTimeString(),
                'Receipt No': sale.receipt_number,
                Customer: sale.customers?.name || 'Walk-in',
                Cashier: sale.user_profiles?.full_name || 'Unknown',
                'Total Amount': sale.total_amount,
                'Payment Method': sale.payment_method,
                Status: sale.status
            }));

            exportToCSV(exportData, `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
            showToast({ type: 'success', message: 'Sales data exported successfully' });
        } catch (error) {
            console.error(error);
            showToast({ type: 'error', message: 'Failed to export sales data' });
        } finally {
            setLoading(false);
        }
    };

    const handleExportInventory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, categories(name)')
                .order('name');

            if (error) throw error;

            const exportData = data.map(product => ({
                Name: product.name,
                Category: product.categories?.name || 'Uncategorized',
                Price: product.price,
                'Stock Quantity': product.stock_quantity,
                'Min Stock Level': product.min_stock_level,
                Barcode: product.barcode || ''
            }));

            exportToCSV(exportData, `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
            showToast({ type: 'success', message: 'Inventory data exported successfully' });
        } catch (error) {
            console.error(error);
            showToast({ type: 'error', message: 'Failed to export inventory data' });
        } finally {
            setLoading(false);
        }
    };

    const handleExportCustomers = async () => {
        setLoading(true);
        try {
            const data = await getCustomers();

            const exportData = data.map(customer => ({
                Name: customer.name,
                Email: customer.email || '',
                Phone: customer.phone || '',
                Address: customer.address || '',
                'Credit Limit': customer.credit_limit,
                'Current Balance': customer.current_balance
            }));

            exportToCSV(exportData, `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
            showToast({ type: 'success', message: 'Customer data exported successfully' });
        } catch (error) {
            console.error(error);
            showToast({ type: 'error', message: 'Failed to export customer data' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-section">
            <div className="settings-card">
                <h3><Database size={20} /> Data Export</h3>
                <p className="settings-desc">Download your data in CSV format for analysis or backup.</p>

                <div className="export-actions">
                    <div className="export-item">
                        <div className="export-info">
                            <h4>Sales History</h4>
                            <p>Export all sales transactions</p>
                        </div>
                        <button
                            className="btn-secondary"
                            onClick={handleExportSales}
                            disabled={loading}
                        >
                            <Download size={16} /> Export Sales
                        </button>
                    </div>

                    <div className="export-item">
                        <div className="export-info">
                            <h4>Inventory List</h4>
                            <p>Export current product stock</p>
                        </div>
                        <button
                            className="btn-secondary"
                            onClick={handleExportInventory}
                            disabled={loading}
                        >
                            <Download size={16} /> Export Inventory
                        </button>
                    </div>

                    <div className="export-item">
                        <div className="export-info">
                            <h4>Customer Database</h4>
                            <p>Export customer details</p>
                        </div>
                        <button
                            className="btn-secondary"
                            onClick={handleExportCustomers}
                            disabled={loading}
                        >
                            <Download size={16} /> Export Customers
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-card">
                <h3><RefreshCw size={20} /> Backup & Restore</h3>
                <div className="backup-placeholder">
                    <p>Automated daily backups are enabled.</p>
                    <button className="btn-secondary" disabled>
                        Create Manual Backup (Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
