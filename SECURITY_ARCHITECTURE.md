# FirestoreX Security Architecture (Phase 2)

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │   Dashboard.jsx  │────────▶│  ShareModal.jsx  │            │
│  │  (File Upload)   │         │  (Share Config)  │            │
│  └────────┬─────────┘         └────────┬─────────┘            │
│           │                             │                       │
│           ▼                             ▼                       │
│  ┌─────────────────────────────────────────────────┐          │
│  │           API Service (api.js)                  │          │
│  │  • uploadFile()                                 │          │
│  │  • updateFileSecurity()                         │          │
│  │  • verifyFilePassword()                         │          │
│  └──────────┬──────────────────────┬───────────────┘          │
│             │                      │                           │
│             ▼                      ▼                           │
│  ┌──────────────────┐   ┌──────────────────┐                 │
│  │ Encryption       │   │ Security         │                 │
│  │ Service          │   │ Service          │                 │
│  │ (encryption.js)  │   │ (security.js)    │                 │
│  │                  │   │                  │                 │
│  │ • encryptFile()  │   │ • hashPassword() │                 │
│  │ • decryptFile()  │   │ • verifyPassword()│                 │
│  │ • deriveKey()    │   │ • validateFile() │                 │
│  └──────────────────┘   └──────────────────┘                 │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS (TLS 1.3)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL Database                    │ │
│  │                                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  files table                                        │ │ │
│  │  │  • id (UUID)                                        │ │ │
│  │  │  • name, size, type                                 │ │ │
│  │  │  • storage_path                                     │ │ │
│  │  │  • owner_id (FK)                                    │ │ │
│  │  │  • access_level (public/private/password/restricted)│ │ │
│  │  │  • password_hash (bcrypt)                           │ │ │
│  │  │  • share_token (unique)                             │ │ │
│  │  │  • share_expires_at (timestamp)                     │ │ │
│  │  │  • max_downloads (integer)                          │ │ │
│  │  │  • downloads (counter)                              │ │ │
│  │  │  • is_encrypted (boolean)                           │ │ │
│  │  │  • encryption_metadata (jsonb)                      │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  activity_logs table                                │ │ │
│  │  │  • id (UUID)                                        │ │ │
│  │  │  • user_id (FK)                                     │ │ │
│  │  │  • action (text)                                    │ │ │
│  │  │  • details (jsonb)                                  │ │ │
│  │  │  • severity (info/warning/danger)                   │ │ │
│  │  │  • created_at (timestamp)                           │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Security Functions                                 │ │ │
│  │  │  • is_share_link_valid(file_id)                     │ │ │
│  │  │  • increment_downloads(file_id)                     │ │ │
│  │  │  • cleanup_expired_shares()                         │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Row Level Security (RLS) Policies                  │ │ │
│  │  │  • Authenticated users can access own files         │ │ │
│  │  │  • Public files accessible via share token          │ │ │
│  │  │  • Share token validation on access                 │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Storage Bucket                         │ │
│  │                                                            │ │
│  │  uploads/                                                 │ │
│  │  ├── encrypted_file_1.bin (AES-256-GCM encrypted)        │ │
│  │  ├── regular_file_2.pdf                                   │ │
│  │  └── encrypted_file_3.bin                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Encryption Flow

### Upload Flow (with encryption):

```
┌──────────┐
│  User    │
│ Selects  │
│  File    │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 1. User provides encryption password │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 2. Generate random salt (16 bytes)  │
│    Generate random IV (12 bytes)    │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 3. Derive key using PBKDF2          │
│    • Password + Salt                │
│    • 100,000 iterations             │
│    • SHA-256 hash                   │
│    • 256-bit key output             │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 4. Encrypt file with AES-256-GCM    │
│    • Key from step 3                │
│    • IV from step 2                 │
│    • Original file data             │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 5. Combine: Salt + IV + Encrypted   │
│    Create new Blob                  │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 6. Upload to Supabase Storage       │
│    • Encrypted blob                 │
│    • Metadata (not the key!)        │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 7. Store metadata in database       │
│    • is_encrypted = true            │
│    • encryption_metadata (algorithm)│
│    • NO PASSWORD STORED             │
└─────────────────────────────────────┘
```

### Download Flow (with decryption):

```
┌──────────┐
│  User    │
│ Requests │
│ Download │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 1. Download encrypted blob          │
│    from Supabase Storage            │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 2. User provides decryption password│
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 3. Extract from blob:               │
│    • Salt (first 16 bytes)          │
│    • IV (next 12 bytes)             │
│    • Encrypted data (rest)          │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 4. Derive key using PBKDF2          │
│    • Password + Salt                │
│    • Same parameters as encryption  │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 5. Decrypt with AES-256-GCM         │
│    • Derived key                    │
│    • Extracted IV                   │
│    • Encrypted data                 │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 6. Return original file             │
│    • Decrypted blob                 │
│    • Original filename              │
└─────────────────────────────────────┘
```

---

## 🔑 Password Hashing Flow

### Share Link Password Protection:

```
┌──────────────────────────────────────┐
│ User creates password-protected share│
└────┬─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 1. User enters password             │
│    e.g., "MySecurePass123"          │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 2. Generate salt (bcrypt)           │
│    • Random 16-byte salt            │
│    • 12 rounds (2^12 iterations)    │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 3. Hash password with bcrypt        │
│    • Password + Salt                │
│    • 12 rounds                      │
│    • Output: 60-char hash           │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 4. Store in database                │
│    • password_hash column           │
│    • Original password discarded    │
└─────────────────────────────────────┘

┌──────────────────────────────────────┐
│ User attempts to access shared file  │
└────┬─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 1. User enters password             │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 2. Retrieve hash from database      │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 3. Compare using bcrypt.compare()   │
│    • Timing-attack resistant        │
│    • Returns true/false             │
└────┬────────────────────────────────┘
     │
     ├─── TRUE ──▶ Grant Access
     │
     └─── FALSE ─▶ Deny Access + Log
```

---

## 🔗 Share Link Security Flow

```
┌──────────────────────────────────────┐
│ User creates share link              │
└────┬─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 1. Generate secure token            │
│    • crypto.getRandomValues()       │
│    • 32 bytes = 64 hex chars        │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 2. Set optional constraints         │
│    • Expiration time (timestamp)    │
│    • Max downloads (integer)        │
│    • Password hash (bcrypt)         │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 3. Store in database                │
│    • share_token (unique)           │
│    • share_expires_at               │
│    • max_downloads                  │
│    • password_hash                  │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 4. Generate share URL               │
│    https://app.com/s/{token}        │
└─────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Someone accesses share link          │
└────┬─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 1. Validate token exists            │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 2. Check expiration                 │
│    IF share_expires_at < NOW()      │
│    THEN reject                      │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 3. Check download limit             │
│    IF downloads >= max_downloads    │
│    THEN reject                      │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 4. Check password (if required)     │
│    IF password_hash exists          │
│    THEN verify password             │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 5. Grant access                     │
│    • Increment download counter     │
│    • Log access attempt             │
│    • Return file                    │
└─────────────────────────────────────┘
```

---

## 🛡️ Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Layer 7: Audit Trail                 │
│  • Activity logging                                     │
│  • Security event tracking                              │
│  • Access attempt monitoring                            │
└─────────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────────┐
│                Layer 6: Access Control                  │
│  • Time-based restrictions (expiration)                 │
│  • Usage-based limits (download counts)                 │
│  • Password protection (bcrypt)                         │
└─────────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────────┐
│              Layer 5: Token-Based Security              │
│  • Cryptographic share tokens                           │
│  • Unique per share link                                │
│  • Revocable                                            │
└─────────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────────┐
│            Layer 4: Database Security (RLS)             │
│  • Row Level Security policies                          │
│  • User isolation                                       │
│  • Query-level access control                           │
└─────────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────────┐
│           Layer 3: Application Security                 │
│  • Input validation                                     │
│  • File type checking                                   │
│  • Size limits                                          │
└─────────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────────┐
│          Layer 2: Cryptographic Security                │
│  • AES-256-GCM encryption                               │
│  • PBKDF2 key derivation                                │
│  • bcrypt password hashing                              │
└─────────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────────┐
│            Layer 1: Transport Security                  │
│  • HTTPS/TLS 1.3                                        │
│  • Certificate validation                               │
│  • Encrypted communication                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User uploads file
       │
       ▼
┌──────────────────────────────────────┐
│  Client-Side Processing              │
│  ┌────────────────────────────────┐  │
│  │ Validate file type & size      │  │
│  └────────────┬───────────────────┘  │
│               │                       │
│               ▼                       │
│  ┌────────────────────────────────┐  │
│  │ Optional: Encrypt with AES-256 │  │
│  │ • Derive key from password     │  │
│  │ • Generate salt & IV           │  │
│  │ • Encrypt file data            │  │
│  └────────────┬───────────────────┘  │
└───────────────┼───────────────────────┘
                │
                │ 2. Upload encrypted/plain file
                │
                ▼
┌──────────────────────────────────────┐
│  Supabase Storage                    │
│  • Store file blob                   │
│  • Generate storage path             │
└────────────┬─────────────────────────┘
             │
             │ 3. Create metadata record
             │
             ▼
┌──────────────────────────────────────┐
│  PostgreSQL Database                 │
│  ┌────────────────────────────────┐  │
│  │ INSERT INTO files              │  │
│  │ • name, size, type             │  │
│  │ • storage_path                 │  │
│  │ • owner_id                     │  │
│  │ • is_encrypted                 │  │
│  │ • encryption_metadata          │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
             │
             │ 4. Log activity
             │
             ▼
┌──────────────────────────────────────┐
│  Activity Logs                       │
│  • action: FILE_UPLOADED             │
│  • user_id                           │
│  • details: {fileName, encrypted}    │
│  • severity: info                    │
└──────────────────────────────────────┘
```

---

## 🔐 Cryptographic Specifications

### AES-256-GCM Encryption:
```
Algorithm:     AES-GCM (Galois/Counter Mode)
Key Size:      256 bits
Block Size:    128 bits
IV Size:       96 bits (12 bytes)
Salt Size:     128 bits (16 bytes)
Tag Size:      128 bits (authentication tag)

Key Derivation: PBKDF2
  Hash:         SHA-256
  Iterations:   100,000
  Output:       256 bits
```

### bcrypt Password Hashing:
```
Algorithm:     bcrypt
Salt Rounds:   12 (2^12 = 4,096 iterations)
Salt Size:     128 bits (16 bytes)
Output:        60 characters (includes salt)
Format:        $2a$12$[22-char salt][31-char hash]
```

### Share Token Generation:
```
Method:        crypto.getRandomValues()
Size:          256 bits (32 bytes)
Encoding:      Hexadecimal
Output:        64 characters
Uniqueness:    Enforced by database constraint
```

---

## 🎯 Security Guarantees

### What We Protect Against:

✅ **Unauthorized Access**
- Row-level security policies
- Token-based authentication
- Password protection

✅ **Data Breaches**
- Client-side encryption
- Encrypted storage
- No plaintext passwords

✅ **Brute Force Attacks**
- bcrypt slow hashing
- Timing-attack resistance
- Activity logging

✅ **Rainbow Table Attacks**
- Unique salts per password
- High iteration counts
- Modern hashing algorithms

✅ **Man-in-the-Middle**
- HTTPS/TLS encryption
- Certificate validation
- Secure communication

✅ **Replay Attacks**
- Time-limited tokens
- Expiration enforcement
- Nonce/IV usage

✅ **Privilege Escalation**
- RLS policies
- Owner validation
- Access level checks

---

## ⚠️ What We Don't Protect Against (Yet)

❌ **Key Recovery**
- No password reset for encrypted files
- Lost password = lost data (by design)

❌ **Multi-Device Sync**
- Keys not synchronized across devices
- Session-based key storage

❌ **Quantum Computing**
- AES-256 is quantum-resistant
- But key exchange is not

❌ **Physical Access**
- Browser memory can be dumped
- Keys stored in RAM during session

❌ **Social Engineering**
- Users can share passwords
- No technical prevention

---

**Last Updated:** 2024  
**Version:** 2.0.0  
**Security Level:** HIGH
