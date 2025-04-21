import { Geist, Geist_Mono } from "next/font/google";
import './globals.css';
import type { Metadata } from "next";
import { AuthProvider } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import { WardrobeProvider } from './context/WardrobeContext';
import { ThemeProvider } from '@/providers/ThemeProvider';
import DbInitializer from '@/components/DbInitializer';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Share your fashion looks",
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={cn(
        'light h-full',
        geistSans.variable,
        geistMono.variable,
        'antialiased bg-white text-black min-h-screen font-normal'
      )}
    >
      <head>
        {/* Force light mode */}
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#FFFFFF" />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { 
            background-color: white !important; 
            color-scheme: light !important;
          }
        `}} />
      </head>
      <body className="bg-white text-black">
        <ThemeProvider>
          <AuthProvider>
            <WardrobeProvider>
              <DbInitializer />
              <NavBar />
              <main className="max-w-7xl mx-auto p-4 pb-28">{children}</main>
              <BottomNav />
              <Toaster position="bottom-right" />
            </WardrobeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
