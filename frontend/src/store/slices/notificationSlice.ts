import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'support' | 'system' | 'success';
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationState {
  items: NotificationItem[];
  isOpen: boolean;
}

const initialState: NotificationState = {
  items: [],
  isOpen: false,
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<Omit<NotificationItem, 'id' | 'createdAt' | 'read'>>
    ) => {
      state.items.unshift({
        ...action.payload,
        id: `notif-${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.read = true;
    },
    markAllAsRead: (state) => {
      state.items.forEach((i) => {
        i.read = true;
      });
    },
    clearNotifications: (state) => {
      state.items = [];
    },
    toggleNotificationDrawer: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeNotificationDrawer: (state) => {
      state.isOpen = false;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  toggleNotificationDrawer,
  closeNotificationDrawer,
} = notificationSlice.actions;

export default notificationSlice.reducer;
