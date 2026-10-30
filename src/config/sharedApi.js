/** Shared avatar API (common backend + MuseTalk). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || 'history';
export const PROJECT_API_KEY =
  import.meta.env.VITE_PROJECT_API_KEY || 'pk_live_history_change_me';
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

/** When true, Talk pages use shared MuseTalk backend instead of mock replies. */
export const USE_SHARED_AVATAR_API =
  String(import.meta.env.VITE_USE_SHARED_AVATAR_API ?? 'true').toLowerCase() !==
  'false';
