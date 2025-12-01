import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const GeneralSettings = () => {
    const { showToast } = useNotification();
    const [settings, setSettings] = useState({
        storeName: 'Dee Wholesale Mart',
        currency: 'GHS',
        taxRate: 0,
        receiptFooter: 'Thank you for your business!'
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem('pos_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setSettings({ ...settings, [e.target.name]: value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        localStorage.setItem('pos_settings', JSON.stringify(settings));
        showToast({ type: 'success', message: 'Settings saved successfully' });
    };

    return (
        <div className="settings-section">
            <div className="settings-card">
                <h3><Settings size={20} /> General Configuration</h3>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label>Store Name</label>
                        <input
                            type="text"
                            name="storeName"
                            value={settings.storeName}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Currency Symbol</label>
                            <select
                                name="currency"
                                value={settings.currency}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="GHS">GHS (₵)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Default Tax Rate (%)</label>
                            <input
                                type="number"
                                name="taxRate"
                                value={settings.taxRate}
                                onChange={handleChange}
                                className="form-input"
                                min="0"
                                max="100"
                                step="0.1"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Receipt Footer Message</label>
                        <textarea
                            name="receiptFooter"
                            value={settings.receiptFooter}
                            onChange={handleChange}
                            className="form-input"
                            rows="2"
                        />
                    </div>
                    <button type="submit" className="btn-primary">
                        <Save size={16} /> Save Settings
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GeneralSettings;
