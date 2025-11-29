import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickGrab - AI-Powered Student Marketplace",
  description: "Real-time, AI-powered, verified student marketplace for campus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
