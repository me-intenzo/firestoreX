import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';

export const SecurityService = {
    /**
     * Log a security-relevant event to the activity_logs table.
     */
    async logEvent(action, details = {}, severity = 'info') {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('activity_logs').insert({
                user_id: user.id,
                action,
                details,
                severity
            });
        } catch (error) {
            console.error('Security Logging Failed:', error);
        }
    },

    /**
     * Validate a file before upload.
     */
    validateFile(file) {
        const BLOCKED_EXTENSIONS = [
            '.exe', '.sh', '.bat', '.cmd', '.vbs', '.js', '.php', '.pl', '.py', '.dll'
        ];
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB

        const fileName = file.name.toLowerCase();
        const isBlocked = BLOCKED_EXTENSIONS.some(ext => fileName.endsWith(ext));

        if (isBlocked) {
            return {
                valid: false,
                error: 'Security Alert: File type not allowed. This attempt has been logged.'
            };
        }

        if (file.size > MAX_SIZE) {
            return {
                valid: false,
                error: 'File size exceeds the 50MB limit.'
            };
        }

        return { valid: true };
    },

    /**
     * Hash password using bcrypt (salt rounds = 12)
     */
    async hashPassword(password) {
        try {
            const salt = await bcrypt.genSalt(12);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            console.error('Password hashing failed:', error);
            throw new Error('Failed to secure password');
        }
    },

    /**
     * Verify password against hash
     */
    async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            console.error('Password verification failed:', error);
            return false;
        }
    },

    /**
     * Generate secure share token
     */
    generateShareToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
};
