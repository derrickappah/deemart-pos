import { supabase } from '../lib/supabaseClient';

export const login = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        console.error('Login error:', error.message);
        return { success: false, error: error.message };
    }
};

export const resetPassword = async (email) => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error.message);
        return { success: false, error: error.message };
    }
};

export const logout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error.message);
        return { success: false, error: error.message };
    }
};

export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;
        if (!user) return null;

        // Fetch user profile with role
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully

        if (profileError) {
            console.warn('Profile fetch error:', profileError.message);
            return { ...user, role: 'cashier' }; // Default role if profile not found
        }

        // If profile doesn't exist, return user with default role
        if (!profile) {
            return { ...user, role: 'cashier' };
        }

        return { ...user, ...profile };
    } catch (error) {
        console.error('Get current user error:', error.message);
        return null;
    }
};

export const signUp = async (email, password, userData) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: userData.full_name,
                },
            },
        });

        if (error) throw error;

        // Update role if provided (admin only operation)
        if (userData.role && data.user) {
            await updateUserRole(data.user.id, userData.role);
        }

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Signup error:', error.message);
        return { success: false, error: error.message };
    }
};

export const updateUserRole = async (userId, role) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Update role error:', error.message);
        return { success: false, error: error.message };
    }
};

export const getAllUsers = async () => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Get users error:', error.message);
        throw error; // Re-throw to let caller handle it
    }
};

export const updateUserStatus = async (userId, isActive) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Update user status error:', error.message);
        return { success: false, error: error.message };
    }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
};
