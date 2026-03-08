# FirestoreX - Next Generation Secure Cloud Storage

> **Academic Capstone Project**
> *Developed by me-intenzo*

## Abstract

FirestoreX is a secure-by-design cloud storage and collaboration platform. It addresses the growing need for privacy-focused digital workspaces by implementing zero-knowledge encryption principles while maintaining a modern, high-performance user experience. This project demonstrates advanced web development techniques, including real-time state management, cryptographic security implementation, and responsive UI design.

## Key Features

- **Client-Side Encryption**: AES-256-GCM encryption for file security
- **Secure File Sharing**: Password-protected, time-limited share links with download limits
- **Modern User Interface**: Responsive Bento Grid layout with Spotlight interactions and Framer Motion animations
- **Real-time Feedback**: Integrated toast notification system for immediate user feedback
- **Secure Authentication**: Role-based access control powered by Supabase Auth
- **Activity Logging**: Audit trail for file and security events
- **Dashboard Views**: Overview, My Files, Recent, Starred, and Activity sections
- **Starred Files**: Per-user browser-persisted starring via localStorage
- **Upload Validation**: Client-side 15 MB file-size checks before upload

## What's New (March 2026)

- Added dedicated Dashboard navigation views for `Overview`, `Recent`, `Starred`, and `Activity`
- Added quick star/unstar controls for files with persistence in `localStorage` (`starredFiles`)
- Added upload guardrails to reject files above 15 MB before upload
- Added real-time activity refresh in file activity modal using Supabase `postgres_changes`
- Improved login UX by disabling Google OAuth button while auth request is in progress
- Refreshed landing page trust/social sections with updated branding and social links

## Technology Stack

- **Frontend**: React.js, Vite
- **Styling**: Tailwind CSS, PostCSS
- **Animations**: Framer Motion
- **Backend/Database**: Supabase (PostgreSQL)
- **Security**: Web Crypto API (AES-256-GCM), bcryptjs
- **State Management**: React Context API
- **Notifications**: Sonner

## Project Structure

```bash
firestore/
|-- database/           # SQL schemas and setup scripts
|-- src/
|   |-- components/     # Reusable UI components
|   |   |-- features/   # Key pages (Landing, Login, Register, Dashboard)
|   |   `-- ui/         # Atomic UI elements
|   |-- contexts/       # Global state (Auth)
|   `-- services/       # API integration layer
|-- public/             # Static assets
`-- ...config files
```

## Screenshots

### Landing Page
A modern, interactive landing page with parallax effects.
![Landing Page](public/assets/landingpage.png)

### User Registration
Secure registration flow with validation.
![Registration](public/assets/signin.png)

### Dashboard
Main workspace interface with file management and activity tools.
![Dashboard](public/assets/dashboard.png)

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/me-intenzo/firestoreX
   cd firestore
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database setup**
   Run the consolidated SQL script in your Supabase SQL Editor:
   ```bash
   database/firestorex_merged_setup.sql
   ```

   If share links open but downloads fail across browsers, also run:
   ```bash
   database/share_flow_cross_browser_fix.sql
   ```

5. **Run locally**
   ```bash
   npm run dev
   ```

## Security Features

### Phase 2 Implementation

- **Client-Side Encryption**: Files encrypted with AES-256-GCM before upload
- **Password Protection**: bcrypt hashing (12 rounds) for share link passwords
- **Time-Limited Shares**: Expiration windows for shared links
- **Download Limits**: Restrict number of downloads per share link
- **Secure Tokens**: Cryptographically secure share token generation
- **Activity Logging**: Audit trail for file operations

For detailed security documentation, see:
- `SECURITY_ARCHITECTURE.md` - Architecture diagrams

## Usage

### Uploading Files
1. Navigate to Dashboard
2. Click `Upload` or drag and drop files
3. Files above 15 MB are blocked client-side with an error toast
4. Files are encrypted client-side when encryption is enabled

### Managing Views
1. Use the left navigation in Dashboard
2. Open `Overview` for storage summary cards
3. Open `Recent` to view latest uploads
4. Open `Starred` to focus on important files
5. Open `Activity` to view recent activity feed

### Starring Files
1. Hover a file card and click the star icon (or use right-click context menu)
2. Starred items are saved in your browser storage
3. Open the `Starred` view to quickly access them

### Sharing Files
1. Right-click on any file
2. Select `Share`
3. Configure security options:
   - Set password protection
   - Set link expiration (hours)
   - Set maximum downloads
4. Copy and share the secure link

## License & Policies

This project is for academic purposes.

