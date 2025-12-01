import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="layout">
            <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
            <div className="main-wrapper">
                <Header onMenuClick={toggleSidebar} />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
            {sidebarOpen && (
                <div className="sidebar-overlay active" onClick={closeSidebar}></div>
            )}
        </div>
    );
};

export default Layout;
