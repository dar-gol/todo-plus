import type { MetadataRoute } from 'next';
import { todoQuickAddPath } from '../features/todos/todo-quick-add-path';

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
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
    ],
    shortcuts: [{ name: 'Dodaj zadanie', url: todoQuickAddPath, icons: [{ src: '/icon-192.png', sizes: '192x192' }] }]
  };
}
