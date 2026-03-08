import { supabase } from '../config/supabase';
import { SecurityService } from './security';
import EncryptionService from './encryption';

class ApiService {
  constructor() {
    this.supabase = supabase;
  }

  // Auth methods
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  }

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  // File methods
  async uploadFile(bucket, path, file, options = {}) {
    const { encrypt = false, encryptionPassword = null } = options;

    // 1. Security Check
    const validation = SecurityService.validateFile(file);
    if (!validation.valid) {
      await SecurityService.logEvent('SUSPICIOUS_UPLOAD_ATTEMPT', {
        fileName: file.name,
        reason: validation.error
      }, 'danger');
      return { data: null, error: { message: validation.error } };
    }

    // 1.5 Size Check (15MB Limit)
    const MAX_SIZE_MB = 15;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return { data: null, error: { message: `File size exceeds the ${MAX_SIZE_MB}MB limit.` } };
    }

    let fileToUpload = file;
    let encryptionMetadata = null;

    // 2. Optional Client-Side Encryption
    if (encrypt && encryptionPassword) {
      try {
        fileToUpload = await EncryptionService.encryptFile(file, encryptionPassword);
        encryptionMetadata = {
          algorithm: 'AES-256-GCM',
          encrypted: true,
          originalName: file.name,
          originalSize: file.size
        };
        await SecurityService.logEvent('FILE_ENCRYPTED', { fileName: file.name }, 'info');
      } catch (error) {
        return { data: null, error: { message: 'Encryption failed: ' + error.message } };
      }
    }

    // 3. Upload to Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileToUpload);

    if (error) {
      await SecurityService.logEvent('UPLOAD_FAILED', { path, error: error.message }, 'warning');
      return { data, error };
    }

    // 4. Create Metadata Record
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('files').insert({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      storage_path: path,
      owner_id: user.id,
      access_level: 'private',
      is_encrypted: encrypt,
      encryption_metadata: encryptionMetadata
    });

    await SecurityService.logEvent('FILE_UPLOADED', {
      fileName: file.name,
      path,
      encrypted: encrypt
    }, 'info');
    return { data, error };
  }

  async getFiles(bucket, path = '') {
    // We get metadata from DB instead of storage list for better security/metadata
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async deleteFile(bucket, path, fileId) {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (storageError) return { error: storageError };

    // Delete from DB
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    return { error: dbError };
  }

  // Security & Sharing
  async updateFileSecurity(fileId, { access_level, password, allowed_users, share_expires_at, max_downloads }) {
    const { data: existingFile, error: existingFileError } = await supabase
      .from('files')
      .select('share_token')
      .eq('id', fileId)
      .single();

    if (existingFileError) {
      return { data: null, error: existingFileError };
    }

    const updates = { access_level };

    // Allow explicitly setting or clearing password gate
    if (password !== undefined) {
      updates.password_hash = password ? await SecurityService.hashPassword(password) : null;
    }

    if (allowed_users !== undefined) updates.allowed_users = allowed_users;

    const isShareEnabled = access_level !== 'private';

    if (isShareEnabled) {
      updates.share_token = existingFile?.share_token || SecurityService.generateShareToken();
      updates.share_expires_at = share_expires_at ?? null;
      updates.max_downloads = max_downloads ?? null;
    } else {
      // Private mode removes external sharing attributes
      updates.share_token = null;
      updates.share_expires_at = null;
      updates.max_downloads = null;
      updates.password_hash = null;
    }

    const { data, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', fileId)
      .select();

    if (!error) {
      await SecurityService.logEvent('FILE_SHARE_UPDATED', {
        fileId,
        access_level,
        hasPassword: !!password,
        hasExpiration: !!share_expires_at,
      }, 'info');
    }

    return { data, error };
  }

  async verifyFilePassword(fileId, password) {
    const { data: file } = await supabase
      .from('files')
      .select('password_hash')
      .eq('id', fileId)
      .single();

    if (!file || !file.password_hash) return { valid: false };

    const valid = await SecurityService.verifyPassword(password, file.password_hash);

    await SecurityService.logEvent('FILE_PASSWORD_ATTEMPT', {
      fileId,
      success: valid
    }, valid ? 'info' : 'warning');

    return { valid };
  }

  async findUserByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('username', username)
      .single();
    return { data, error };
  }

  async logFileAccess(fileId, action) {
    const { data: { user } } = await supabase.auth.getUser();

    try {
      if (user?.id) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'FILE_ACCESS',
          details: { fileId, action },
          severity: 'info'
        });
      }
    } catch (error) {
      console.warn('Failed to log file access activity:', error?.message || error);
    }

    if (action === 'download') {
      try {
        await supabase.rpc('increment_downloads', { file_id: fileId });
      } catch (error) {
        console.warn('Failed to increment download count:', error?.message || error);
      }
    }
  }

  async getFileLogs(fileId) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
            *,
            profiles:user_id (username, email)
          `)
      .eq('details->>fileId', fileId)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async getSharedFileByToken(token) {
    const { data, error } = await supabase
      .from('files')
      .select('id, name, size, type, storage_path, owner_id, access_level, password_hash, allowed_users, share_token, share_expires_at, max_downloads, downloads, created_at')
      .eq('share_token', token)
      .single();

    return { data, error };
  }

  async getSharedDownload(storagePath) {
    const bucket = supabase.storage.from('uploads');

    const { data: signedData, error: signedError } = await bucket.createSignedUrl(storagePath, 120);
    if (!signedError && signedData?.signedUrl) {
      return { blob: null, url: signedData.signedUrl, error: null };
    }

    const { data: blob, error: downloadError } = await bucket.download(storagePath);
    if (!downloadError && blob) {
      return { blob, url: null, error: null };
    }

    const { data: publicData } = bucket.getPublicUrl(storagePath);
    if (publicData?.publicUrl) {
      return { blob: null, url: publicData.publicUrl, error: null };
    }

    return {
      blob: null,
      url: null,
      error: signedError || downloadError || { message: 'Unable to download shared file. Check storage policies for shared access.' },
    };
  }

  // Database methods
  async getData(table, filters = {}) {
    let query = supabase.from(table).select('*');

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;

    if (error && (error.code === '42501' || error.status === 403)) {
      // Log RLS violations or Forbidden errors
      SecurityService.logEvent('UNAUTHORIZED_ACCESS_ATTEMPT', { table, error: error.message }, 'danger');
    }

    return { data, error };
  }

  async insertData(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    return { data: result, error };
  }

  async updateData(table, id, data) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    return { data: result, error };
  }

  async deleteData(table, id) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    return { error };
  }
}

export default new ApiService();
