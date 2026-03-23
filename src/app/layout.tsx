import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinMatrix | Next Gen Stock Tracker",
  description: "Real-time stock tracking with a sleek, modern interface.",
  appleWebApp: { title: "FinMatrix" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className={`${inter.className} min-h-full bg-[#0a0f18] text-gray-100 selection:bg-indigo-500/30`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
