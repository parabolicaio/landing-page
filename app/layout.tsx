import React from 'react';
import type { Metadata } from 'next';
import '../styles/globals.css';
import { instrument } from '../lib/fonts';
import Header from '../components/layout/Header';

export const metadata: Metadata = {
  title: 'Parabolica',
  description: 'Design-led product engineering and growth.',
  icons: {
    icon: [
      { url: '/brand/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon.ico', rel: 'shortcut icon' },
    ],
    apple: [
      { url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'manifest',
        url: '/brand/site.webmanifest',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${instrument.variable} font-sans`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
