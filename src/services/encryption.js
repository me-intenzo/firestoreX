/**
 * Client-Side Encryption Service
 * Implements AES-256-GCM encryption using Web Crypto API
 */

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  /**
   * Derive encryption key from user password using PBKDF2
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt file data
   */
  async encryptFile(file, password) {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKey(password, salt);

      const fileData = await file.arrayBuffer();
      const encryptedData = await crypto.subtle.encrypt(
        { name: this.algorithm, iv: iv },
        key,
        fileData
      );

      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

      return new Blob([combined], { type: 'application/octet-stream' });
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Decrypt file data
   */
  async decryptFile(encryptedBlob, password) {
    try {
      const data = await encryptedBlob.arrayBuffer();
      const dataView = new Uint8Array(data);

      const salt = dataView.slice(0, 16);
      const iv = dataView.slice(16, 28);
      const encryptedData = dataView.slice(28);

      const key = await this.deriveKey(password, salt);
      const decryptedData = await crypto.subtle.decrypt(
        { name: this.algorithm, iv: iv },
        key,
        encryptedData
      );

      return new Blob([decryptedData]);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt file - incorrect password or corrupted data');
    }
  }

  /**
   * Generate secure random token for share links
   */
  generateShareToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

export default new EncryptionService();
