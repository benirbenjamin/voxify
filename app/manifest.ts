import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Voxify Space — Choir Management & Music Learning',
    short_name: 'Voxify',
    description: 'Manage members, schedule rehearsals & Sunday services, assign songs, distribute voice parts audio, and help singers learn their parts effortlessly.',
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#9333ea',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
