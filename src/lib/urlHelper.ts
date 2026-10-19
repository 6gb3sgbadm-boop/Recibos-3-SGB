/**
 * Helper to build reliable public URLs for remote mobile signatures via QR Code and WhatsApp.
 */

const STORAGE_KEY_CUSTOM_URL = 'bombeiros_b4_custom_url';

// Official published public URL of this application (accessible by any mobile device)
export const PUBLIC_APP_URL = 'https://ais-pre-dk5c6255bmhj6llulv4dta-403845492800.us-west2.run.app';

export function getCustomBaseUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_CUSTOM_URL) || '';
  } catch {
    return '';
  }
}

export function saveCustomBaseUrl(url: string): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_URL);
    }
  } catch {}
}

/**
 * Returns the best, fully functional public URL for mobile signature scanning.
 * Always resolves to a public address (ais-pre or custom domain) so that ANY smartphone
 * scanning the QR code or receiving the WhatsApp link can access the receipt without IAP 403 errors.
 */
export function getReceiptPublicUrl(receiptId: string): string {
  const custom = getCustomBaseUrl();
  if (custom && custom.trim()) {
    const cleanCustom = custom.trim().replace(/\/+$/, '');
    return `${cleanCustom}/?recibo=${encodeURIComponent(receiptId)}`;
  }

  // Check current window location
  const origin = window.location.origin;

  // If running in development (ais-dev-) or localhost, automatically route to the published public domain
  if (origin.includes('ais-dev-') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return `${PUBLIC_APP_URL}/?recibo=${encodeURIComponent(receiptId)}`;
  }

  // If already running on the public domain (ais-pre) or any custom deployed host
  const cleanOrigin = origin.replace(/\/+$/, '');
  return `${cleanOrigin}/?recibo=${encodeURIComponent(receiptId)}`;
}

// Backward compatibility helpers
export function getActiveReceiptUrl(receiptId: string): string {
  return getReceiptPublicUrl(receiptId);
}

export function getSharedReceiptUrl(receiptId: string): string {
  return getReceiptPublicUrl(receiptId);
}

export function isDevEnvironment(): boolean {
  return window.location.origin.includes('ais-dev-');
}
