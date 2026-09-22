export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const DELIVERY_FEE = 3.99;
export const TAX_RATE = 0.08;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  BROWSE: '/browse',
  RESTAURANT: (id: string) => `/restaurants/${id}`,
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER: (id: string) => `/orders/${id}`,
  TRACKING: (id: string) => `/tracking/${id}`,
  PROFILE: '/profile',
  ADDRESSES: '/profile/addresses',
  FAVOURITES: '/favourites',
  PAYMENTS: '/payments',
  SUPPORT: '/support',
  // Owner
  OWNER_DASHBOARD: '/owner/dashboard',
  OWNER_RESTAURANT: '/owner/restaurants',
  OWNER_MANAGERS: '/owner/managers',
  OWNER_MENU: '/owner/menu',
  OWNER_ORDERS: '/owner/orders',
  OWNER_PAYMENTS: '/owner/payments',
  OWNER_REVIEWS: '/owner/reviews',
  OWNER_REPORTS: '/owner/reports',
  // Driver
  DRIVER_ORDERS: '/driver/deliveries',
  DRIVER_HISTORY: '/driver/history',
  DRIVER_PAYMENTS: '/driver/payments',
  // Manager
  MANAGER_DASHBOARD: '/manager/dashboard',
  MANAGER_ORDERS: '/manager/orders',
  MANAGER_PAYMENTS: '/manager/payments',
  MANAGER_REVIEWS: '/manager/reviews',
  MANAGER_SUPPORT: '/manager/support',
  MANAGER_REPORTS: '/manager/reports',
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_DRIVERS: '/admin/drivers',
  ADMIN_MANAGERS: '/admin/managers',
  ADMIN_SESSIONS: '/admin/sessions',
  ADMIN_RESTAURANTS: '/admin/restaurants',
  ADMIN_MENU: '/admin/menu',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_SUPPORT: '/admin/support',
};

// Returns the correct home route for each role after login
export function getRoleHome(role: string): string {
  switch (role?.toUpperCase()) {
    case 'RESTAURANT_OWNER': return ROUTES.OWNER_DASHBOARD;
    case 'DELIVERY_DRIVER':  return ROUTES.DRIVER_ORDERS;
    case 'MANAGER':          return ROUTES.MANAGER_DASHBOARD;
    case 'ADMIN':            return ROUTES.ADMIN_DASHBOARD;
    case 'CUSTOMER':         return ROUTES.HOME;
    case 'GUEST':            return ROUTES.HOME;
    default:                 return ROUTES.HOME;
  }
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'warning',
  READY_FOR_PICKUP: 'info',
  OUT_FOR_DELIVERY: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
};

export const TRACKING_STATUS_LABELS: Record<string, string> = {
  ORDER_PLACED: 'Order Placed',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  RESTAURANT_ACCEPTED: 'Restaurant Accepted',
  PREPARING: 'Being Prepared',
  READY_FOR_PICKUP: 'Ready for Pickup',
  DRIVER_ASSIGNED: 'Driver Assigned',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ROLE_LABELS: Record<string, string> = {
  GUEST: 'Guest',
  CUSTOMER: 'Customer',
  RESTAURANT_OWNER: 'Restaurant Owner',
  DELIVERY_DRIVER: 'Delivery Driver',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
};

export const CUISINE_TYPES = [
  'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai',
  'Continental', 'Fast Food', 'Biryani', 'Pizza', 'Burger',
  'Desserts', 'Beverages', 'Healthy', 'Seafood', 'North Indian',
  'South Indian',
];

export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'ALL_DAY'];

export const PAYMENT_METHODS = [
  { value: 'COD', label: '💵 Cash on Delivery' },
  { value: 'ONLINE', label: '💳 Online Payment (Mock)' },
];

export const DEFAULT_RESTAURANT_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop';

export const DEFAULT_FOOD_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop';

export const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=FF6B35&color=fff&name=User&bold=true';
