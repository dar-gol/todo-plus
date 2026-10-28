import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Todo Plus',
    short_name: 'Todo Plus',
    description: 'Twoja prywatna i rodzinna lista zadań.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf6ee',
    theme_color: '#2f7d5a',
    lang: 'pl',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
  };
}
