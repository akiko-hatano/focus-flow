import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JotaiProvider } from "@/components/providers/JotaiProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FocusFlow",
  description: "Sample TODO app for automation tool research",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface font-sans min-h-screen antialiased">
        <JotaiProvider>{children}</JotaiProvider>
      </body>
    </html>
  );
}
