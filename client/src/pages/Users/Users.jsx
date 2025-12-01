import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, UserX, UserCheck } from 'lucide-react';
import { getAllUsers, signUp, updateUserRole, updateUserStatus } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import UserFormModal from './UserFormModal';
import './Users.css';

const Users = () => {
    const { showToast } = useNotification();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const { isAdmin } = useAuth();

    useEffect(() => {
        if (!isAdmin) {
            return;
        }
        loadUsers();
    }, [isAdmin]);

    const loadUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error('Error loading users:', err);
            setError(err.message || 'Failed to load users');
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to load users'
            });
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            let result;
            if (editingUser) {
                result = await updateUserRole(editingUser.id, formData.role);
            } else {
                result = await signUp(formData.email, formData.password, {
                    full_name: formData.full_name,
                    role: formData.role,
                });
            }

            if (result.success) {
                showToast({
                    type: 'success',
                    title: 'Success',
                    message: editingUser ? 'User role updated successfully' : 'User created successfully'
                });
                setIsModalOpen(false);
                loadUsers();
            } else {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: result.error || 'Operation failed'
                });
            }
        } catch (err) {
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Operation failed'
            });
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            const result = await updateUserStatus(userId, !currentStatus);
            if (result.success) {
                showToast({
                    type: 'success',
                    title: 'Success',
                    message: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
                });
                loadUsers();
            } else {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: result.error || 'Failed to update user status'
                });
            }
        } catch (err) {
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to update user status'
            });
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin) {
        return (
            <div className="access-denied">
                <h2>Access Denied</h2>
                <p>Only administrators can access user management.</p>
            </div>
        );
    }

    return (
        <div className="users-container">
            <div className="users-header">
                <h1>User Management</h1>
                <button className="btn btn-primary" onClick={handleAddClick}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Add User
                </button>
            </div>

            <div className="users-controls">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center">Loading...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="6" className="text-center error-text">{error}</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="6" className="text-center">No users found</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.full_name || '-'}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge ${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="icon-btn edit"
                                                title="Edit Role"
                                                onClick={() => handleEditClick(user)}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className={`icon-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                                                title={user.is_active ? 'Deactivate' : 'Activate'}
                                                onClick={() => handleToggleStatus(user.id, user.is_active)}
                                            >
                                                {user.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingUser}
            />
        </div>
    );
};

export default Users;
