import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);

    // Add a notification to the center
    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        setNotifications(prev => [newNotification, ...prev]);
        return newNotification.id;
    }, []);

    // Show a toast message
    const showToast = useCallback((toast) => {
        const newToast = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            duration: 3000,
            ...toast
        };
        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, newToast.duration);

        return newToast.id;
    }, []);

    // Mark notification as read
    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === id ? { ...notif, read: true } : notif
            )
        );
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        setNotifications(prev =>
            prev.map(notif => ({ ...notif, read: true }))
        );
    }, []);

    // Delete notification
    const deleteNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, []);

    // Clear all notifications
    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    // Dismiss toast
    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Get unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    const value = {
        notifications,
        toasts,
        unreadCount,
        addNotification,
        showToast,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        dismissToast
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
