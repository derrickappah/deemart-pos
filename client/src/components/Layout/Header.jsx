import React, { useState, useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { getBranches } from '../../services/branchService';
import NotificationCenter from '../NotificationCenter';
import './Layout.css';

const Header = ({ onMenuClick }) => {
    const { unreadCount } = useNotification();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load selected branch from localStorage first
        const savedBranch = localStorage.getItem('selectedBranch');
        if (savedBranch) {
            try {
                const parsed = JSON.parse(savedBranch);
                setSelectedBranch(parsed);
            } catch (e) {
                console.error('Error parsing saved branch:', e);
            }
        }
        
        loadBranches();
    }, []);

    const loadBranches = async () => {
        setLoading(true);
        try {
            const data = await getBranches();
            setBranches(data);
            
            // Check if we have a saved branch, otherwise select the first one
            const savedBranch = localStorage.getItem('selectedBranch');
            if (!savedBranch && data.length > 0) {
                const firstBranch = data[0];
                setSelectedBranch(firstBranch);
                localStorage.setItem('selectedBranch', JSON.stringify(firstBranch));
            } else if (savedBranch) {
                // Verify saved branch still exists in the list
                try {
                    const parsed = JSON.parse(savedBranch);
                    const branchExists = data.find(b => b.id === parsed.id);
                    if (!branchExists && data.length > 0) {
                        // Saved branch no longer exists, select first available
                        const firstBranch = data[0];
                        setSelectedBranch(firstBranch);
                        localStorage.setItem('selectedBranch', JSON.stringify(firstBranch));
                    }
                } catch (e) {
                    // If parsing fails, select first branch
                    if (data.length > 0) {
                        const firstBranch = data[0];
                        setSelectedBranch(firstBranch);
                        localStorage.setItem('selectedBranch', JSON.stringify(firstBranch));
                    }
                }
            }
        } catch (err) {
            console.error('Error loading branches:', err);
            // Fallback to default branch if API fails
            const defaultBranch = { id: 1, name: 'Main Branch' };
            setBranches([defaultBranch]);
            const savedBranch = localStorage.getItem('selectedBranch');
            if (!savedBranch) {
                setSelectedBranch(defaultBranch);
                localStorage.setItem('selectedBranch', JSON.stringify(defaultBranch));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBranchChange = (e) => {
        const branchId = parseInt(e.target.value);
        const branch = branches.find(b => b.id === branchId);
        if (branch) {
            setSelectedBranch(branch);
            localStorage.setItem('selectedBranch', JSON.stringify(branch));
        }
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="header">
            <div className="header-left">
                <button className="hamburger-btn" onClick={onMenuClick}>
                    <Menu size={24} />
                </button>
                <select 
                    className="branch-selector"
                    value={selectedBranch?.id || ''}
                    onChange={handleBranchChange}
                    disabled={loading || branches.length === 0}
                >
                    {loading ? (
                        <option>Loading branches...</option>
                    ) : branches.length === 0 ? (
                        <option>No branches available</option>
                    ) : (
                        branches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))
                    )}
                </select>
            </div>

            <div className="header-center">
                <span className="current-date">{currentDate}</span>
            </div>

            <div className="header-right">
                <div className="notification-wrapper" style={{ position: 'relative' }}>
                    <button
                        className="icon-btn notification-btn"
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount}</span>
                        )}
                    </button>
                    <NotificationCenter
                        isOpen={isNotificationsOpen}
                        onClose={() => setIsNotificationsOpen(false)}
                    />
                </div>
            </div>
        </header>
    );
};

export default Header;
