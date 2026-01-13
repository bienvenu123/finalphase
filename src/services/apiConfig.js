// Central API base URL used by all services.
//
// Priority:
// 1) REACT_APP_API_URL (recommended for production/deployments; include "/api")
// 2) Same-origin "/api" when deployed (prevents http/https mismatch)
// 3) Local development default
export const API_BASE_URL =
  (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.replace(/\/$/, '')) ||
  (typeof window !== 'undefined' &&
  window.location &&
  window.location.hostname &&
  window.location.hostname !== 'localhost'
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api');


