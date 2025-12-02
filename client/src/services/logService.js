import { supabase } from '../lib/supabaseClient';

/**
 * Create an activity log entry
 * @param {Object} logData - The log data
 * @param {string} logData.actionType - Type of action (e.g., 'product_create', 'stock_update')
 * @param {string} logData.entityType - Type of entity (e.g., 'product', 'sale', 'customer')
 * @param {string|number} logData.entityId - ID of the affected entity
 * @param {string} logData.description - Human-readable description
 * @param {Object} logData.oldValues - Previous values (for updates)
 * @param {Object} logData.newValues - New values (for creates/updates)
 * @param {Object} logData.metadata - Additional context
 * @param {string|number} logData.branchId - Branch ID (optional)
 * @returns {Promise<Object>} Result object with success status
 */
export const createActivityLog = async (logData) => {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.warn('Cannot create activity log: No authenticated user');
            return { success: false, error: 'No authenticated user' };
        }

        // Get selected branch from localStorage if not provided
        let branchId = logData.branchId;
        if (!branchId) {
            const savedBranch = localStorage.getItem('selectedBranch');
            if (savedBranch) {
                try {
                    const parsed = JSON.parse(savedBranch);
                    branchId = parsed.id;
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        }

        const { data, error } = await supabase
            .from('activity_logs')
            .insert({
                user_id: user.id,
                action_type: logData.actionType,
                entity_type: logData.entityType,
                entity_id: logData.entityId ? String(logData.entityId) : null,
                description: logData.description,
                old_values: logData.oldValues || null,
                new_values: logData.newValues || null,
                metadata: logData.metadata || null,
                branch_id: branchId || null,
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error creating activity log:', error.message);
        // Don't throw - logging failures shouldn't break the main operation
        return { success: false, error: error.message };
    }
};

/**
 * Get activity logs with filtering and pagination
 * @param {Object} filters - Filter options
 * @param {string} filters.actionType - Filter by action type
 * @param {string} filters.entityType - Filter by entity type
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.startDate - Start date (ISO string)
 * @param {string} filters.endDate - End date (ISO string)
 * @param {number} filters.limit - Number of records to return
 * @param {number} filters.offset - Offset for pagination
 * @returns {Promise<Array>} Array of activity logs
 */
export const getActivityLogs = async (filters = {}) => {
    try {
        // First, get the activity logs
        let query = supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.actionType) {
            query = query.eq('action_type', filters.actionType);
        }

        if (filters.entityType) {
            query = query.eq('entity_type', filters.entityType);
        }

        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }

        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        // Pagination
        const limit = filters.limit || 100;
        const offset = filters.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) return [];

        // Fetch user profiles for all unique user IDs
        const userIds = [...new Set(data.map(log => log.user_id).filter(Boolean))];
        let userProfilesMap = {};

        if (userIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, full_name, email, role')
                .in('id', userIds);

            if (!profilesError && profiles) {
                profiles.forEach(profile => {
                    userProfilesMap[profile.id] = profile;
                });
            }
        }

        // Merge user profile data with logs
        const logsWithUsers = data.map(log => ({
            ...log,
            user: log.user_id ? (userProfilesMap[log.user_id] || null) : null
        }));

        return logsWithUsers;
    } catch (error) {
        console.error('Error fetching activity logs:', error.message);
        throw error;
    }
};

/**
 * Get activity log statistics
 * @param {Object} filters - Filter options (same as getActivityLogs)
 * @returns {Promise<Object>} Statistics object
 */
export const getActivityLogStats = async (filters = {}) => {
    try {
        const logs = await getActivityLogs({ ...filters, limit: 1000 });
        
        const stats = {
            total: logs.length,
            byActionType: {},
            byEntityType: {},
            byUser: {},
            recentActivity: logs.slice(0, 10),
        };

        logs.forEach(log => {
            // Count by action type
            stats.byActionType[log.action_type] = (stats.byActionType[log.action_type] || 0) + 1;
            
            // Count by entity type
            stats.byEntityType[log.entity_type] = (stats.byEntityType[log.entity_type] || 0) + 1;
            
            // Count by user
            const userName = log.user?.full_name || log.user?.email || 'Unknown';
            stats.byUser[userName] = (stats.byUser[userName] || 0) + 1;
        });

        return stats;
    } catch (error) {
        console.error('Error fetching activity log stats:', error.message);
        throw error;
    }
};

/**
 * Delete activity logs (admin only)
 * @param {Object} filters - Filter options for deletion
 * @returns {Promise<Object>} Result object
 */
export const deleteActivityLogs = async (filters = {}) => {
    try {
        let query = supabase.from('activity_logs').delete();

        if (filters.beforeDate) {
            query = query.lt('created_at', filters.beforeDate);
        }

        if (filters.actionType) {
            query = query.eq('action_type', filters.actionType);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, deletedCount: data?.length || 0 };
    } catch (error) {
        console.error('Error deleting activity logs:', error.message);
        throw error;
    }
};

