import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/layout/auth-provider";
import { MainLayout } from "@/components/layout/main-layout";

export const metadata: Metadata = {
  title: "Orange Sport Center - Modern Sports Venue Booking",
  description: "Book your favorite sports venues with ease. Modern, fast, and reliable booking system for Orange Sport Center.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
