import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/store/provider';
import { ThemeWrapper } from '@/components/layout/ThemeWrapper';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'BiteRush — Order Fast. Eat Fresh.',
  description: 'BiteRush is your premium food delivery platform. Order from top restaurants near you, track your delivery in real-time, and enjoy fresh meals delivered fast.',
  keywords: 'food delivery, restaurant, order food, BiteRush',
  openGraph: {
    title: 'BiteRush — Order Fast. Eat Fresh.',
    description: 'Premium food delivery — order from top restaurants',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <StoreProvider>
          <ThemeWrapper>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'var(--surface-color)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
                error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
              }}
            />
          </ThemeWrapper>
        </StoreProvider>
      </body>
    </html>
  );
}
