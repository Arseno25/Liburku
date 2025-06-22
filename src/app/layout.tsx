import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Inter } from "next/font/google";
import { cn } from '@/lib/utils';
import { CustomCursor } from '@/components/custom-cursor';
import { Analytics } from "@vercel/analytics/next"

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Liburku - Kalender Hari Libur Indonesia',
  description: 'Jelajahi hari libur nasional dan cuti bersama dengan kalender interaktif dan perencana liburan AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head />
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <CustomCursor />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
