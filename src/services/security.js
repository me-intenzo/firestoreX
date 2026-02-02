import { supabase } from '../config/supabase';

export const SecurityService = {
    /**
     * Log a security-relevant event to the activity_logs table.
     * @param {string} action - The action name (e.g. 'FILE_UPLOAD', 'LOGIN_FAILED')
     * @param {object} details - Additional context
     * @param {'info'|'warning'|'danger'} severity - Risk level
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
            // Fail silently to avoid breaking user flow, but log to console
            console.error('Security Logging Failed:', error);
        }
    },

    /**
     * Validate a file before upload.
     * Checks for dangerous extensions and size limits.
     * @param {File} file 
     * @returns {{valid: boolean, error?: string}}
     */
    validateFile(file) {
        const BLOCKED_EXTENSIONS = [
            '.exe', '.sh', '.bat', '.cmd', '.vbs', '.js', '.php', '.pl', '.py', '.dll'
        ];
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB

        // Extract extension safely
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
    }
};
