import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AuthUser } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseOrderDate(dateVal: any): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }
  if (Array.isArray(dateVal)) {
    // Java LocalDateTime array: [year, month, day, hour, minute, second, nano]
    const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0] = dateVal;
    const d = new Date(year, month - 1, day, hour, minute, second);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    const cleaned = trimmed.replace(' ', 'T');
    const d2 = new Date(cleaned);
    if (!isNaN(d2.getTime())) return d2;
  }
  return null;
}

export function formatDate(dateString: any): string {
  if (!dateString) return 'N/A';
  const parsed = parseOrderDate(dateString);
  if (!parsed) return typeof dateString === 'string' ? dateString : 'N/A';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── LOCAL STORAGE SESSION MANAGEMENT ─────────────────────

const TOKEN_KEY = 'biterush_token';
const USER_KEY = 'biterush_user';

export function saveToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `biterush_token=${token}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export function loadToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function saveUser(user: AuthUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Set cookie so middleware.ts can read role for server-side RBAC protection
    document.cookie = `biterush_user=${encodeURIComponent(
      JSON.stringify({ role: user.role, id: user.id })
    )}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export function loadUser(): AuthUser | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.cookie = 'biterush_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'biterush_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function extractToken(): string | null {
  return loadToken();
}


// ── REVIEW VISIBILITY MODERATION PERSISTENCE ──────────────
const HIDDEN_REVIEWS_KEY = 'biterush_hidden_reviews';
const UNHIDDEN_REVIEWS_KEY = 'biterush_unhidden_reviews';

export function getHiddenReviewsMap(): Record<string, any> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(HIDDEN_REVIEWS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function getUnhiddenReviewsMap(): Record<string, any> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(UNHIDDEN_REVIEWS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function isReviewHidden(reviewId: string): boolean {
  if (!reviewId) return false;
  const hiddenMap = getHiddenReviewsMap();
  const unhiddenMap = getUnhiddenReviewsMap();
  if (hiddenMap[reviewId]) return true;
  if (unhiddenMap[reviewId]) return false;
  return false;
}

export function isReviewVisible(review: any): boolean {
  if (!review) return false;
  const id = review.reviewId || review.id;
  const hiddenMap = getHiddenReviewsMap();
  if (hiddenMap[id]) return false;
  const unhiddenMap = getUnhiddenReviewsMap();
  if (unhiddenMap[id]) return true;
  if (review.isVisible === false) return false;
  return true;
}

export function setReviewHiddenLocally(review: any) {
  if (typeof window !== 'undefined' && review) {
    const id = review.reviewId || review.id;
    if (!id) return;
    try {
      const unhiddenMap = getUnhiddenReviewsMap();
      delete unhiddenMap[id];
      localStorage.setItem(UNHIDDEN_REVIEWS_KEY, JSON.stringify(unhiddenMap));

      const hiddenMap = getHiddenReviewsMap();
      hiddenMap[id] = { ...review, reviewId: id, isVisible: false };
      localStorage.setItem(HIDDEN_REVIEWS_KEY, JSON.stringify(hiddenMap));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to hide review locally', e);
    }
  }
}

export function setReviewUnhiddenLocally(review: any) {
  if (typeof window !== 'undefined' && review) {
    const id = typeof review === 'string' ? review : (review.reviewId || review.id);
    if (!id) return;
    try {
      const hiddenMap = getHiddenReviewsMap();
      const reviewObj = hiddenMap[id] || (typeof review === 'object' ? review : { id });
      delete hiddenMap[id];
      localStorage.setItem(HIDDEN_REVIEWS_KEY, JSON.stringify(hiddenMap));

      const unhiddenMap = getUnhiddenReviewsMap();
      unhiddenMap[id] = { ...reviewObj, reviewId: id, isVisible: true };
      localStorage.setItem(UNHIDDEN_REVIEWS_KEY, JSON.stringify(unhiddenMap));

      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to unhide review locally', e);
    }
  }
}

export function mergeAllReviews(apiReviews: any[], restaurantId?: string): any[] {
  const hiddenMap = getHiddenReviewsMap();
  const unhiddenMap = getUnhiddenReviewsMap();
  const map = new Map<string, any>();

  // Add API reviews
  (apiReviews || []).forEach(r => {
    const id = r.reviewId || r.id;
    if (id) map.set(id, { ...r });
  });

  // Add cached hidden reviews
  Object.values(hiddenMap).forEach((r: any) => {
    const id = r.reviewId || r.id;
    if (id && (!restaurantId || r.restaurantId === restaurantId || !r.restaurantId)) {
      if (!map.has(id)) {
        map.set(id, { ...r, isVisible: false });
      } else {
        const existing = map.get(id);
        map.set(id, { ...existing, isVisible: false });
      }
    }
  });

  // Add cached unhidden reviews
  Object.values(unhiddenMap).forEach((r: any) => {
    const id = r.reviewId || r.id;
    if (id && (!restaurantId || r.restaurantId === restaurantId || !r.restaurantId)) {
      if (!map.has(id)) {
        map.set(id, { ...r, isVisible: true });
      } else {
        const existing = map.get(id);
        map.set(id, { ...existing, isVisible: true });
      }
    }
  });

  return Array.from(map.values());
}

export function getReviewDishName(rev: any): string {
  if (rev?.menuItemName && rev.menuItemName !== 'Dish Item' && rev.menuItemName !== 'Menu Item') {
    return rev.menuItemName;
  }
  if (rev?.title?.startsWith('Dish: ')) {
    return rev.title.replace(/^Dish:\s*/, '');
  }
  const match = rev?.comment?.match(/\[Dish:\s*([^\]]+)\]/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return rev?.menuItemName || 'Menu Item';
}

export function getCleanReviewComment(comment?: string): string {
  if (!comment) return '';
  return comment.replace(/^\[Dish:\s*[^\]]+\]\s*/, '').trim();
}

/**
 * Helper to determine if an order is assigned to a specific driver.
 * Checks driverName, driverPhone, driverId, updatedBy, and user details (name, email username, phone, id).
 */
export function isDriverAssignedToOrder(order: any, driverUser: any): boolean {
  if (!order || !driverUser) return false;
  const assignedDriverName = (order.driverName || '').trim().toLowerCase();
  const assignedDriverPhone = (order.driverPhone || '').replace(/\D/g, '');

  const userName = (driverUser.name || driverUser.fullName || '').trim().toLowerCase();
  const userEmail = (driverUser.email || '').trim().toLowerCase();
  const emailPrefix = (userEmail.split('@')[0] || '').trim().toLowerCase();
  const userPhone = (driverUser.phone || '').replace(/\D/g, '');
  const userId = String(driverUser.id || driverUser.userId || '');

  // Exact or contains match on name
  if (assignedDriverName && userName && (assignedDriverName === userName || userName.includes(assignedDriverName) || assignedDriverName.includes(userName))) {
    return true;
  }

  // Match on email prefix (e.g. driver login)
  if (assignedDriverName && emailPrefix && (assignedDriverName === emailPrefix || assignedDriverName.includes(emailPrefix))) {
    return true;
  }

  // Match on phone
  if (assignedDriverPhone && userPhone && assignedDriverPhone === userPhone) {
    return true;
  }

  // If order carries driverId
  if (order.driverId && userId && String(order.driverId) === userId) {
    return true;
  }

  // If order was updated/delivered by this driver user ID or email
  if (order.updatedBy && userId && (String(order.updatedBy) === userId || String(order.updatedBy).toLowerCase() === userEmail)) {
    return true;
  }

  return false;
}

/**
 * Helper to determine if an order is completely unassigned (not assigned by admin to any driver yet).
 */
export function isOrderUnassigned(order: any): boolean {
  if (!order) return false;
  const driverName = (order.driverName || '').trim();
  const driverPhone = (order.driverPhone || '').trim();
  const driverId = (order.driverId || '').trim();
  return !driverName && !driverPhone && !driverId;
}

