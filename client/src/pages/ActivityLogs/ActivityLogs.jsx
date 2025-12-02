import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, RefreshCw, Eye } from 'lucide-react';
import { getActivityLogs } from '../../services/logService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import './ActivityLogs.css';

const ActivityLogs = () => {
    const { showToast } = useNotification();
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [actionTypeFilter, setActionTypeFilter] = useState('');
    const [entityTypeFilter, setEntityTypeFilter] = useState('');
    const [userIdFilter, setUserIdFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Get unique action types and entity types for filters
    const actionTypes = [
        'product_create', 'product_update', 'product_delete',
        'stock_update', 'stock_adjustment',
        'sale_create', 'sale_update', 'sale_cancel',
        'customer_create', 'customer_update', 'customer_delete',
        'supplier_create', 'supplier_update', 'supplier_delete',
        'user_create', 'user_update', 'user_delete',
        'payment_create', 'payment_update',
    ];

    const entityTypes = [
        'product', 'sale', 'customer', 'supplier', 'user', 'stock', 'payment'
    ];

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const filters = {
                actionType: actionTypeFilter || undefined,
                entityType: entityTypeFilter || undefined,
                userId: userIdFilter || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                limit: 500,
            };

            const data = await getActivityLogs(filters);
            setLogs(data || []);
        } catch (err) {
            console.error('Error loading activity logs:', err);
            setError(err.message || 'Failed to load activity logs');
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to load activity logs'
            });
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (e) => {
        e.preventDefault();
        loadLogs();
    };

    const handleReset = () => {
        setSearchTerm('');
        setActionTypeFilter('');
        setEntityTypeFilter('');
        setUserIdFilter('');
        setStartDate('');
        setEndDate('');
        loadLogs();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionTypeLabel = (actionType) => {
        return actionType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getEntityTypeLabel = (entityType) => {
        return entityType.charAt(0).toUpperCase() + entityType.slice(1);
    };

    const filteredLogs = logs.filter(log => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            log.description?.toLowerCase().includes(searchLower) ||
            log.user?.full_name?.toLowerCase().includes(searchLower) ||
            log.user?.email?.toLowerCase().includes(searchLower) ||
            log.entity_id?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="activity-logs-container">
            <div className="activity-logs-header">
                <h1>Activity Logs</h1>
                <p className="subtitle">Track all user actions and system changes</p>
            </div>

            <div className="activity-logs-controls">
                <form onSubmit={handleFilter} className="filters-form">
                    <div className="filters-row">
                        <div className="filter-group">
                            <label>
                                <Search size={16} /> Search
                            </label>
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <label>Action Type</label>
                            <select
                                value={actionTypeFilter}
                                onChange={(e) => setActionTypeFilter(e.target.value)}
                            >
                                <option value="">All Actions</option>
                                {actionTypes.map(type => (
                                    <option key={type} value={type}>
                                        {getActionTypeLabel(type)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Entity Type</label>
                            <select
                                value={entityTypeFilter}
                                onChange={(e) => setEntityTypeFilter(e.target.value)}
                            >
                                <option value="">All Entities</option>
                                {entityTypes.map(type => (
                                    <option key={type} value={type}>
                                        {getEntityTypeLabel(type)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="filters-row">
                        <div className="filter-group">
                            <label>
                                <Calendar size={16} /> Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <label>
                                <Calendar size={16} /> End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="filter-actions">
                            <button type="submit" className="btn-primary">
                                <Filter size={16} /> Apply Filters
                            </button>
                            <button type="button" onClick={handleReset} className="btn-secondary">
                                <RefreshCw size={16} /> Reset
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {loading ? (
                <div className="loading-state">
                    <RefreshCw size={24} className="spinner" />
                    <p>Loading activity logs...</p>
                </div>
            ) : error ? (
                <div className="error-state">
                    <p>{error}</p>
                    <button onClick={loadLogs} className="btn-primary">
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="empty-state">
                    <Eye size={48} />
                    <p>No activity logs found</p>
                </div>
            ) : (
                <div className="activity-logs-table-container">
                    <table className="activity-logs-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Description</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="date-cell">
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td className="user-cell">
                                        <div className="user-info">
                                            <User size={16} />
                                            <div>
                                                <div className="user-name">
                                                    {log.user?.full_name || log.user?.email || 'Unknown User'}
                                                </div>
                                                <div className="user-role">
                                                    {log.user?.role || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="action-cell">
                                        <span className={`action-badge action-${log.action_type.split('_')[0]}`}>
                                            {getActionTypeLabel(log.action_type)}
                                        </span>
                                    </td>
                                    <td className="entity-cell">
                                        <span className="entity-badge">
                                            {getEntityTypeLabel(log.entity_type)}
                                        </span>
                                        {log.entity_id && (
                                            <span className="entity-id">ID: {log.entity_id}</span>
                                        )}
                                    </td>
                                    <td className="description-cell">
                                        {log.description}
                                    </td>
                                    <td className="details-cell">
                                        {(log.old_values || log.new_values) && (
                                            <details className="log-details">
                                                <summary>View Details</summary>
                                                <div className="details-content">
                                                    {log.old_values && (
                                                        <div className="old-values">
                                                            <strong>Before:</strong>
                                                            <pre>{JSON.stringify(log.old_values, null, 2)}</pre>
                                                        </div>
                                                    )}
                                                    {log.new_values && (
                                                        <div className="new-values">
                                                            <strong>After:</strong>
                                                            <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </details>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ActivityLogs;

