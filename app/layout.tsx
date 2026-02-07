import React from 'react';
import '../styles/globals.css';
import { instrument } from '../lib/fonts';
import Header from '../components/layout/Header';

export const metadata = {
  title: 'Parabolica',
  description: 'Design-led product engineering and growth.',
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

