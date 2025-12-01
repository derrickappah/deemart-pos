import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, Users } from 'lucide-react';
import { getDailySalesSummary } from '../../services/salesService';
import { getLowStockItems } from '../../services/productService';
import { getCustomers } from '../../services/customerService';
import { getSalesTrend, getTopProducts, getCategoryDistribution } from '../../services/analyticsService';
import { useNotification } from '../../context/NotificationContext';
import SalesTrendChart from '../../components/Charts/SalesTrendChart';
import TopProductsChart from '../../components/Charts/TopProductsChart';
import CategoryChart from '../../components/Charts/CategoryChart';
import '../../components/Charts/Charts.css';
import './Dashboard.css';

const Dashboard = () => {
    const { addNotification, showToast } = useNotification();
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        lowStockCount: 0,
        totalCustomers: 0
    });
    const [chartData, setChartData] = useState({
        salesTrend: [],
        topProducts: [],
        categoryDistribution: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use Promise.allSettled to handle partial failures gracefully
            const results = await Promise.allSettled([
                getDailySalesSummary(),
                getLowStockItems(),
                getCustomers(),
                getSalesTrend(7),
                getTopProducts(10),
                getCategoryDistribution()
            ]);

            const [salesData, lowStockData, customersData, salesTrend, topProducts, categoryDist] = results.map((result, index) => {
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    console.error(`Error loading dashboard data ${index}:`, result.reason);
                    // Return defaults for failed requests
                    switch (index) {
                        case 0: return { totalSales: 0, totalOrders: 0 };
                        case 1: return [];
                        case 2: return [];
                        case 3: return [];
                        case 4: return [];
                        case 5: return [];
                        default: return null;
                    }
                }
            });

            setStats({
                totalSales: salesData?.totalSales || 0,
                totalOrders: salesData?.totalOrders || 0,
                lowStockCount: lowStockData?.length || 0,
                totalCustomers: customersData?.length || 0
            });

            setChartData({
                salesTrend: salesTrend || [],
                topProducts: topProducts || [],
                categoryDistribution: categoryDist || []
            });

            // Generate low stock notifications
            if (lowStockData && lowStockData.length > 0) {
                // Add a summary notification if many items
                if (lowStockData.length > 3) {
                    addNotification({
                        type: 'warning',
                        title: 'Low Stock Alert',
                        message: `${lowStockData.length} items are running low on stock.`,
                        link: '/inventory'
                    });
                } else {
                    // Add individual notifications for few items
                    lowStockData.forEach(item => {
                        addNotification({
                            type: 'warning',
                            title: 'Low Stock Alert',
                            message: `${item.name} is running low (${item.stock_quantity} units left)`,
                            link: '/inventory'
                        });
                    });
                }
            }

            // Show error toast if any requests failed
            const failedCount = results.filter(r => r.status === 'rejected').length;
            if (failedCount > 0) {
                showToast({
                    type: 'warning',
                    title: 'Partial Data Load',
                    message: `Some dashboard data could not be loaded. ${failedCount} request(s) failed.`
                });
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError(error.message || 'Failed to load dashboard data');
            showToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to load dashboard data'
            });
        } finally {
            setLoading(false);
        }
    };

    const Widget = ({ title, value, icon: Icon, color }) => (
        <div className="dashboard-widget">
            <div className={`widget-icon ${color}`}>
                <Icon size={24} />
            </div>
            <div className="widget-info">
                <h3>{title}</h3>
                <p>{loading ? '...' : value}</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>

            <div className="widgets-grid">
                <Widget
                    title="Today's Sales"
                    value={`GHS ${stats.totalSales.toFixed(2)}`}
                    icon={DollarSign}
                    color="blue"
                />
                <Widget
                    title="Today's Orders"
                    value={stats.totalOrders}
                    icon={ShoppingBag}
                    color="green"
                />
                <Widget
                    title="Low Stock Items"
                    value={stats.lowStockCount}
                    icon={AlertTriangle}
                    color="orange"
                />
                <Widget
                    title="Total Customers"
                    value={stats.totalCustomers}
                    icon={Users}
                    color="purple"
                />
            </div>

            {loading ? (
                <div className="charts-loading">
                    <p>Loading analytics...</p>
                </div>
            ) : (
                <div className="charts-grid">
                    <SalesTrendChart data={chartData.salesTrend} />
                    <TopProductsChart data={chartData.topProducts} />
                    <CategoryChart data={chartData.categoryDistribution} />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
