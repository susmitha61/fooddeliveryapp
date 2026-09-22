import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartState, CartItem } from '@/types';

const STORAGE_KEY = 'biterush_cart';

function getInitialState(): CartState & { pendingItem?: any } {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const pendingRaw = localStorage.getItem('biterush_pending_item');
      const pendingItem = pendingRaw ? JSON.parse(pendingRaw) : null;

      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          items: parsed.items || [],
          restaurantId: parsed.restaurantId || null,
          restaurantName: parsed.restaurantName || null,
          totalItems: (parsed.items || []).reduce((s: number, i: CartItem) => s + i.quantity, 0),
          totalAmount: (parsed.items || []).reduce((s: number, i: CartItem) => s + (i.subtotal || i.price * i.quantity), 0),
          isOpen: false,
          pendingItem,
        };
      }
      return {
        items: [],
        restaurantId: null,
        restaurantName: null,
        totalItems: 0,
        totalAmount: 0,
        isOpen: false,
        pendingItem,
      };
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
  }
  return {
    items: [],
    restaurantId: null,
    restaurantName: null,
    totalItems: 0,
    totalAmount: 0,
    isOpen: false,
    pendingItem: null,
  };
}

function saveCartToStorage(state: CartState) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: state.items,
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
      }));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }
}

function recalc(state: CartState) {
  state.totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  state.totalAmount = state.items.reduce((s, i) => s + (i.subtotal || i.price * i.quantity), 0);
  saveCartToStorage(state);
}

const EMPTY_CART: CartState & { pendingItem?: any } = {
  items: [],
  restaurantId: null,
  restaurantName: null,
  totalItems: 0,
  totalAmount: 0,
  isOpen: false,
  pendingItem: null,
};

const initialState: CartState & { pendingItem?: any } = EMPTY_CART;

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrateCart(state) {
      if (typeof window !== 'undefined') {
        const loaded = getInitialState();
        state.items = loaded.items;
        state.restaurantId = loaded.restaurantId;
        state.restaurantName = loaded.restaurantName;
        state.totalItems = loaded.totalItems;
        state.totalAmount = loaded.totalAmount;
        if (loaded.pendingItem) {
          state.pendingItem = loaded.pendingItem;
        }
      }
    },
    setPendingItem(state, action: PayloadAction<any>) {
      state.pendingItem = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('biterush_pending_item', JSON.stringify(action.payload));
        } else {
          localStorage.removeItem('biterush_pending_item');
        }
      }
    },
    clearPendingItem(state) {
      state.pendingItem = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('biterush_pending_item');
      }
    },
    setCart(state, action: PayloadAction<{ items: CartItem[]; restaurantId?: string; restaurantName?: string }>) {
      state.items = action.payload.items;
      state.restaurantId = action.payload.restaurantId || null;
      state.restaurantName = action.payload.restaurantName || null;
      recalc(state);
    },
    addItem(state, action: PayloadAction<{ restaurantId: string; restaurantName: string; item: { menuItemId: string; name: string; price: number; quantity: number; imageUrl?: string } }>) {
      const { restaurantId, restaurantName, item } = action.payload;

      // If cart has items from a different restaurant, clear first
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = [];
      }

      state.restaurantId = restaurantId;
      state.restaurantName = restaurantName;

      const existing = state.items.find(i => i.menuItemId === item.menuItemId || i.id === item.menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.subtotal = existing.price * existing.quantity;
      } else {
        state.items.push({
          id: item.menuItemId,
          menuItemId: item.menuItemId,
          restaurantId,
          menuItemName: item.name,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          subtotal: item.price * item.quantity,
        });
      }
      recalc(state);
    },
    updateItemQty(state, action: PayloadAction<{ id?: string; menuItemId?: string; quantity: number }>) {
      const { id, menuItemId, quantity } = action.payload;
      const targetId = menuItemId || id;
      const item = state.items.find(i => i.id === targetId || i.menuItemId === targetId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i !== item);
          if (state.items.length === 0) {
            state.restaurantId = null;
            state.restaurantName = null;
          }
        } else {
          item.quantity = quantity;
          item.subtotal = item.price * item.quantity;
        }
      }
      recalc(state);
    },
    removeItem(state, action: PayloadAction<string>) {
      const targetId = action.payload;
      state.items = state.items.filter(i => i.id !== targetId && i.menuItemId !== targetId);
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }
      recalc(state);
    },
    clearCart(state) {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = null;
      state.totalItems = 0;
      state.totalAmount = 0;
      saveCartToStorage(state);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    openCart(state) { state.isOpen = true; },
    closeCart(state) { state.isOpen = false; },
    toggleCart(state) { state.isOpen = !state.isOpen; },
  },
});

export const {
  hydrateCart, setPendingItem, clearPendingItem,
  setCart, addItem, updateItemQty, removeItem,
  clearCart, openCart, closeCart, toggleCart,
} = cartSlice.actions;
export default cartSlice.reducer;
