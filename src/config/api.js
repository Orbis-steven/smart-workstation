const runtimeEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};

function normalizeApiUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function isLocalHostname(hostname = '') {
  return ['localhost', '127.0.0.1', '::1'].includes(String(hostname).toLowerCase());
}

function resolveDefaultWorkstationApiUrl() {
  if (typeof window !== 'undefined' && window.location) {
    if (isLocalHostname(window.location.hostname)) {
      return 'http://127.0.0.1:8100';
    }
    return normalizeApiUrl(window.location.origin);
  }

  return 'http://127.0.0.1:8100';
}

export const WORKSTATION_API_URL =
  normalizeApiUrl(runtimeEnv?.VITE_WORKSTATION_API_URL) || resolveDefaultWorkstationApiUrl();

export const INVENTORY_DATA_PROVIDER = 'mock';
