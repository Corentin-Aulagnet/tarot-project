/**
 * Root Layout Component (app/layout.tsx)
 * The top-level layout wrapping all pages with navigation header and global styles.
 * Includes font configuration and metadata for the application.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Example from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tarot Score Tracker",
  description: "Easily track your tarot games and scores with our intuitive app. Log game details, calculate scores, and visualize player performance over time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      
      <body className="min-h-full flex flex-col"><Example/>{children}</body>
    </html>
  );
}
