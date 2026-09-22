'use client';

import { Provider } from 'react-redux';
import { store } from './index';
import { useEffect } from 'react';
import { hydrate } from './slices/authSlice';
import { hydrateCart } from './slices/cartSlice';

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = store.dispatch;

  useEffect(() => {
    dispatch(hydrate());
    dispatch(hydrateCart());
  }, [dispatch]);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}
