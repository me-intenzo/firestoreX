export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'FirestoreX',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.VITE_APP_ENV || 'development'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings'
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'firestorex_auth_token',
  USER_PREFERENCES: 'firestorex_user_prefs',
  THEME: 'firestorex_theme'
};

export const API_ENDPOINTS = {
  FILES: '/api/files',
  USERS: '/api/users',
  ANALYTICS: '/api/analytics',
  SECURITY: '/api/security'
};