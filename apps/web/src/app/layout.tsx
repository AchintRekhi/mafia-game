import type { Metadata } from 'next';
import { Cinzel, Inter } from 'next/font/google';
import './globals.css';
import { SocketListener } from '@/components/SocketListener';

const display = Cinzel({ subsets: ['latin'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Mafia',
  description: 'A web-based Mafia party game. The app is your narrator.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body min-h-screen">
        <SocketListener />
        {children}
      </body>
    </html>
  );
}
