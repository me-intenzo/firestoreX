import { supabase } from '../config/supabase';
import { SecurityService } from './security';

class ApiService {
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
  async uploadFile(bucket, path, file) {
    // 1. Security Check
    const validation = SecurityService.validateFile(file);
    if (!validation.valid) {
      await SecurityService.logEvent('SUSPICIOUS_UPLOAD_ATTEMPT', {
        fileName: file.name,
        reason: validation.error
      }, 'danger');
      return { data: null, error: { message: validation.error } };
    }

    // 2. Upload to Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) {
      await SecurityService.logEvent('UPLOAD_FAILED', { path, error: error.message }, 'warning');
      return { data, error };
    }

    // 3. Create Metadata Record
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('files').insert({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      storage_path: path,
      owner_id: user.id
    });

    await SecurityService.logEvent('FILE_UPLOADED', { fileName: file.name, path }, 'info');
    return { data, error };
  }

  async getFiles(bucket, path = '') {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);
    return { data, error };
  }

  async deleteFile(bucket, path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { data, error };
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