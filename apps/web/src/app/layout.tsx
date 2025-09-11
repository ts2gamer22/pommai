import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P, Work_Sans } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from './providers/ConvexClientProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart2P = Press_Start_2P({
  variable: "--font-minecraft",
  subsets: ["latin"],
  weight: "400",
});

// Using Work Sans as a geometric alternative to Geo - clean, modern, highly readable
const geo = Work_Sans({
  variable: "--font-geo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pommai - Safe AI Voice Companion for Children",
  description: "An innovative voice-first AI assistant designed specifically for children, featuring advanced safety controls and educational interactions.",
  icons: {
    icon: '/pommaifaviconnn.png',
    apple: '/pommaifaviconnn.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} ${geo.variable} antialiased font-geo`}
      >
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
