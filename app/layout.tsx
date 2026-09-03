import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./holiday.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Takehome Atlas — Global Salary Explorer";
const description = "Compare take-home salary, expat tax regimes, living costs and possible savings across countries.";

export const metadata: Metadata = {
  metadataBase: new URL("https://takehomeatlas.com"),
  title,
  description,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title, description, images: [{ url: "/og.png", width: 1732, height: 909 }] },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
