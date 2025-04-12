import { Geist, Geist_Mono } from "next/font/google";
import './globals.css';
import type { Metadata } from "next";
import { AuthProvider } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Share your fashion looks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <NavBar />
          <main className="max-w-7xl mx-auto p-4 pb-20">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
