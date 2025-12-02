import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Truck,
    FileText,
    Settings,
    UserCog,
    LogOut,
    User,
    FileSearch
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { isAdmin, isManager, user, logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: ShoppingCart, label: 'POS', path: '/pos' },
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: Users, label: 'Customers', path: '/customers' },
        { icon: Truck, label: 'Suppliers', path: '/suppliers' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: FileSearch, label: 'Activity Logs', path: '/logs' },
    ];

    const handleNavClick = () => {
        // Close sidebar on mobile when nav item is clicked
        if (onClose) {
            onClose();
        }
    };

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
        }
    };

    return (
        <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
            <div className="sidebar-header">
                <div className="logo">DeeMart POS</div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                        onClick={handleNavClick}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                {(isAdmin || isManager) && (
                    <NavLink
                        to="/users"
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                        onClick={handleNavClick}
                    >
                        <UserCog size={20} />
                        <span>Users</span>
                    </NavLink>
                )}

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''}`
                    }
                    onClick={handleNavClick}
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user-profile">
                    <div className="sidebar-user-avatar">
                        <User size={18} />
                    </div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user?.full_name || user?.email || 'User'}</span>
                        <span className="sidebar-user-role">{user?.role || 'cashier'}</span>
                    </div>
                </div>
                <button className="nav-item logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
