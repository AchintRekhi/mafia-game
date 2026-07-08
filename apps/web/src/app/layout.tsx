import type { Metadata } from 'next';
import { Limelight, Josefin_Sans } from 'next/font/google';
import './globals.css';
import { SocketListener } from '@/components/SocketListener';
import { Ambience } from '@/components/Ambience';

const display = Limelight({ weight: '400', subsets: ['latin'], variable: '--font-display' });
const body = Josefin_Sans({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Mafia',
  description: 'A web-based Mafia party game. The app is your narrator.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body min-h-screen">
        <Ambience />
        <div className="relative z-10">
          <SocketListener />
          {children}
        </div>
      </body>
    </html>
  );
}
