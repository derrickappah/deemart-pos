import React, { useState } from 'react';
import { User, Settings as SettingsIcon, Database, Info } from 'lucide-react';
import ProfileSettings from './ProfileSettings';
import GeneralSettings from './GeneralSettings';
import DataManagement from './DataManagement';
import './Settings.css';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings />;
            case 'general':
                return <GeneralSettings />;
            case 'data':
                return <DataManagement />;
            case 'about':
                return (
                    <div className="settings-card">
                        <h3><Info size={20} /> About DeeMart POS</h3>
                        <div className="about-content">
                            <p><strong>Version:</strong> 1.0.0</p>
                            <p><strong>Developed by:</strong> Antigravity AI</p>
                            <p><strong>Support:</strong> support@deemart.com</p>
                            <p className="copyright">© 2025 Dee Wholesale Mart. All rights reserved.</p>
                        </div>
                    </div>
                );
            default:
                return <ProfileSettings />;
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Settings</h1>
            </div>

            <div className="settings-layout">
                <div className="settings-sidebar">
                    <button
                        className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User size={18} /> Profile
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <SettingsIcon size={18} /> General
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'data' ? 'active' : ''}`}
                        onClick={() => setActiveTab('data')}
                    >
                        <Database size={18} /> Data Management
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'about' ? 'active' : ''}`}
                        onClick={() => setActiveTab('about')}
                    >
                        <Info size={18} /> About
                    </button>
                </div>

                <div className="settings-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Settings;
