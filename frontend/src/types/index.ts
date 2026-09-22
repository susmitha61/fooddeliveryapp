/* ── ALL APP-WIDE TYPESCRIPT TYPES ─────────────────────── */

export type UserRole =
  | 'GUEST' | 'CUSTOMER' | 'RESTAURANT_OWNER'
  | 'DELIVERY_DRIVER' | 'MANAGER' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;        // backend field is 'name' (from AuthUser.name)
  email: string;
  phone: string;
  role: UserRole;
  isActive?: boolean;
  isLoggedIn?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;     // nested user object
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  errorCode?: string;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/* Restaurant */
export type RestaurantStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'CLOSED';

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  cuisineType?: string;
  mealType?: string;
  addressLine1?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  minimumOrder?: number;
  deliveryFee?: number;
  estimatedDeliveryTime?: number;
  deliveryTimeMinutes?: number;
  isPureVeg?: boolean;
  isOpen?: boolean;
  active?: boolean;
  status?: RestaurantStatus;
  openingTime?: string;
  closingTime?: string;
  createdAt?: string;
}

export interface RestaurantRequest {
  name: string;
  description?: string;
  cuisineType?: string;
  mealType?: string;
  addressLine1?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  minimumOrder?: number;
  deliveryFee?: number;
  estimatedDeliveryTime?: number;
  isPureVeg?: boolean;
  openingTime?: string;
  closingTime?: string;
}

/* Menu */
export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId?: string;
  category?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg?: boolean;
  vegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  spicy?: boolean;
  mealType?: string;
  isAvailable?: boolean;
  available?: boolean;
  calories?: number;
  preparationTime?: number;
  tags?: string[];
  rating?: number;
  totalRatings?: number;
}

export interface MenuResponse {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  itemsByCategory: Record<string, MenuItem[]>;
  uncategorizedItems?: MenuItem[];
  bestSellers?: MenuItem[];
  todaysSpecials?: MenuItem[];
}

/* Cart */
export interface CartItem {
  id: string;
  menuItemId: string;
  restaurantId: string;
  menuItemName: string;
  name?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  specialInstructions?: string;
  subtotal: number;
}

export interface Cart {
  id?: string;
  userId?: string;
  restaurantId?: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

export interface AddToCartRequest {
  menuItemId: string;
  restaurantId: string;
  quantity: number;
  specialInstructions?: string;
}

/* Order */
export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export type PaymentMethod = 'COD' | 'ONLINE';

export interface OrderItem {
  id?: string;
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName?: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: string;
  totalAmount: number;
  deliveryFee?: number;
  grandTotal?: number;
  deliveryAddressId?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt?: string;
  estimatedDeliveryTime?: number;
}

export interface PlaceOrderRequest {
  addressId: string;
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
}

/* Tracking */
export type TrackingStatus =
  | 'ORDER_PLACED' | 'PAYMENT_CONFIRMED' | 'RESTAURANT_ACCEPTED'
  | 'PREPARING' | 'READY_FOR_PICKUP' | 'DRIVER_ASSIGNED'
  | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface TrackingUpdate {
  status: TrackingStatus;
  message?: string;
  timestamp: string;
}

export interface TrackingResponse {
  orderId: string;
  currentStatus: TrackingStatus;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  estimatedMinutes?: number;
  updates: TrackingUpdate[];
  lastUpdated?: string;
}

/* Payment */
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InitiatePaymentRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
}

/* Address */
export interface Address {
  id: string;
  userId?: string;
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault?: boolean;
}

export interface AddressRequest {
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault?: boolean;
}

/* Support */
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
  id: string;
  userId: string;
  orderId?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt?: string;
}

/* Review */
export interface Review {
  id: string;
  userId: string;
  restaurantId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  userName?: string;
  createdAt: string;
}

export interface ReviewRequest {
  restaurantId: string;
  orderId?: string;
  rating: number;
  comment?: string;
}

/* User Profile */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  profilePictureUrl?: string;
  createdAt?: string;
}

/* Redux State */
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  totalItems: number;
  totalAmount: number;
  isOpen: boolean;
}

export interface ThemeState {
  theme: 'dark' | 'warm';
}

/* Filter */
export interface RestaurantFilter {
  city?: string;
  area?: string;
  cuisineType?: string;
  isPureVeg?: boolean;
  isOpen?: boolean;
  minRating?: number;
  keyword?: string;
  sortBy?: string;
  page?: number;
  size?: number;
}
