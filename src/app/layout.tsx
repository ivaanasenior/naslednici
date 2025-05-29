import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans' 
});

export const metadata: Metadata = {
  title: 'Osnovni sud u Foči - kalkulator nasljedstva',
  description: 'Kalkulator za izračunavanje nasljednog dijela u Republici Srpskoj',
  manifest: '/naslednici/manifest.json', 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr" suppressHydrationWarning={true}>
      <head>
        <meta name="theme-color" content="#3498db" /> 
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
