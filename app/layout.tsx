import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/context/AuthContext';
import { ChoirProvider } from '../lib/context/ChoirContext';

export const metadata: Metadata = {
  title: 'Voxify Space — Choir Management & Music Learning SaaS Platform',
  description: 'Manage members, schedule rehearsals & Sunday services, assign songs, distribute voice parts audio, and help singers learn their parts effortlessly.',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: 'Voxify Space — Choir Management Platform',
    description: 'Empowering choir leaders and singers with multi-track audio practice, event scheduling, and member management.',
    images: ['/logo.png'],
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
          </ChoirProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
