import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/context/AuthContext';
import { ChoirProvider } from '../lib/context/ChoirContext';
import { PWARegister } from '../components/pwa/PWARegister';
import { AnalyticsTracker } from '../components/analytics/AnalyticsTracker';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxify.space';

export const viewport: Viewport = {
  themeColor: '#9333ea',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Voxify Space — Choir Management & Music Learning SaaS Platform',
  description: 'Manage members, schedule rehearsals & Sunday services, assign songs, distribute voice parts audio, and help singers learn their parts effortlessly.',
  applicationName: 'Voxify Space',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Voxify Space',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Voxify Space — Choir Management Platform',
    description: 'Empowering choir leaders and singers with multi-track audio practice, event scheduling, and member management.',
    url: baseUrl,
    siteName: 'Voxify Space',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Voxify Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voxify Space — Choir Management Platform',
    description: 'Empowering choir leaders and singers with multi-track audio practice, event scheduling, and member management.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-purple-600 selection:text-white">
        <AuthProvider>
          <ChoirProvider>
            {children}
            <PWARegister />
            <AnalyticsTracker />
          </ChoirProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

