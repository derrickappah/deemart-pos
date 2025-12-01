import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Info, XCircle, Trash2, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
    const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotification();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={18} className="notif-icon-success" />;
            case 'error':
                return <XCircle size={18} className="notif-icon-error" />;
            case 'warning':
                return <AlertTriangle size={18} className="notif-icon-warning" />;
            case 'info':
            default:
                return <Info size={18} className="notif-icon-info" />;
        }
    };

    const formatTime = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000); // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
            onClose();
        }
    };

    return (
        <>
            <div className="notification-overlay" onClick={onClose}></div>
            <div className="notification-center">
                <div className="notification-header">
                    <h3>Notifications</h3>
                    <div className="notification-actions">
                        {notifications.length > 0 && (
                            <>
                                <button onClick={markAllAsRead} className="mark-all-btn" title="Mark all as read">
                                    <Check size={16} />
                                </button>
                                <button onClick={clearAll} className="clear-all-btn" title="Clear all">
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="notification-list">
                    {notifications.length === 0 ? (
                        <div className="empty-notifications">
                            <Info size={32} />
                            <p>No notifications</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="notification-icon">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="notification-content">
                                    <div className="notification-title">{notification.title}</div>
                                    <div className="notification-message">{notification.message}</div>
                                    <div className="notification-time">{formatTime(notification.timestamp)}</div>
                                </div>
                                <button
                                    className="notification-delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationCenter;
