import type { Metadata, Viewport } from 'next';
import { Nunito_Sans } from 'next/font/google';
import './globals.css';
import { AppProviders } from './providers';

const font = Nunito_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-app' });

export const metadata: Metadata = {
  title: 'Todo Plus',
  description: 'Twoja prywatna i rodzinna lista zadań.',
  applicationName: 'Todo Plus'
};

export const viewport: Viewport = { themeColor: '#2f7d5a', colorScheme: 'light' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body className={font.variable}><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
