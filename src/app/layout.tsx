import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'HairMatch AI — Analisis Bentuk Wajah & Rekomendasi Rambut',
    template: '%s | HairMatch AI',
  },
  description:
    'Temukan model rambut ideal berdasarkan analisis AI bentuk wajah Anda. Booking barbershop favorit langsung dari satu platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-neutral-950 text-white`}>
        {children}
      </body>
    </html>
  );
}
