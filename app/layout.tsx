import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fact Pop! — Multiplication Practice Game',
  description: 'Practice multiplication facts from 2 to 12 with multiple-choice and fill-in-the-blank rounds.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${nunito.variable} antialiased`}>{children}</body></html>;
}

