import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Eye } from 'lucide-react';
import { getSales } from '../../services/salesService';
import { useNotification } from '../../context/NotificationContext';
import SaleDetailsModal from './SaleDetailsModal';
import './Reports.css';

const Reports = () => {
    const { showToast } = useNotification();
    const [sales, setSales] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSales(startDate, endDate);
            setSales(data);
        } catch (err) {
            console.error('Error loading sales:', err);
            setError(err.message || 'Failed to load sales data');
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to load sales data'
            });
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (e) => {
        e.preventDefault();
        loadSales();
    };

    const handleSaleClick = (sale) => {
        setSelectedSale(sale);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSale(null);
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h1>Sales Reports</h1>
            </div>

            <div className="reports-controls">
                <form onSubmit={handleFilter} className="date-filter-form">
                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        <Filter size={18} style={{ marginRight: '8px' }} />
                        Filter
                    </button>
                </form>
            </div>

            <div className="table-container">
                <table className="reports-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Sale ID</th>
                            <th>Payment Method</th>
                            <th>Status</th>
                            <th>Total Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center">Loading...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="6" className="text-center error-text">{error}</td></tr>
                        ) : sales.length === 0 ? (
                            <tr><td colSpan="6" className="text-center">No sales found for this period</td></tr>
                        ) : (
                            sales.map(sale => (
                                <tr key={sale.id} className="sale-row">
                                    <td>{new Date(sale.created_at).toLocaleString()}</td>
                                    <td>{sale.sale_number || `#${sale.id}`}</td>
                                    <td className="capitalize">{sale.payment_method}</td>
                                    <td>
                                        <span className={`status-badge ${sale.status === 'completed' ? 'completed' : sale.status}`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="text-right">GHS {(sale.final_amount || sale.total_amount || 0).toFixed(2)}</td>
                                    <td>
                                        <button
                                            className="view-details-btn"
                                            onClick={() => handleSaleClick(sale)}
                                            title="View sale details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <SaleDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                sale={selectedSale}
            />
        </div>
    );
};

export default Reports;
