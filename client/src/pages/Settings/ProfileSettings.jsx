import React, { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const ProfileSettings = () => {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [formData, setFormData] = useState({
        fullName: user?.full_name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        // In a real app, call authService.updateProfile(formData)
        showToast({ type: 'success', message: 'Profile updated successfully' });
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            showToast({ type: 'error', message: 'Passwords do not match' });
            return;
        }
        // In a real app, call authService.updatePassword(formData.newPassword)
        showToast({ type: 'success', message: 'Password changed successfully' });
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    return (
        <div className="settings-section">
            <div className="settings-card">
                <h3><User size={20} /> Personal Information</h3>
                <form onSubmit={handleProfileUpdate}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="form-input disabled"
                        />
                    </div>
                    <button type="submit" className="btn-primary">
                        <Save size={16} /> Save Changes
                    </button>
                </form>
            </div>

            <div className="settings-card">
                <h3><Lock size={20} /> Change Password</h3>
                <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <button type="submit" className="btn-primary">
                        <Save size={16} /> Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettings;
