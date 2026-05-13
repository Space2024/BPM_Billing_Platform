import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/components/providers/store-provider";
import { NotificationContainer } from "@/components/ui/notifications";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Customer Billing Platform",
  description: "Customer billing registration and verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Pre-warm TCP connection to billing API */}
        <link rel="preconnect" href="http://14.96.15.50:7080" />
        <link rel="dns-prefetch" href="http://14.96.15.50:7080" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>
          {children}
          <NotificationContainer />
        </StoreProvider>
      </body>
    </html>
  );
}
