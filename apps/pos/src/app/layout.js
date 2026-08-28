import { Outfit, Albert_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { SerwistProvider } from "@serwist/turbopack/react";
import { PowerSyncProvider } from "@/lib/powersync/PowerSyncProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const albert_sans = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin"],
});

export const metadata = {
  title: "Lenzro POS",
  description: "Ring up orders for your restaurant",
  icons: { icon: "/icon-512.png", apple: "/icon-512.png" },
};

export const viewport = {
  themeColor: "#059669",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${albert_sans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <SerwistProvider swUrl="/serwist/sw.js">
          <PowerSyncProvider>{children}</PowerSyncProvider>
        </SerwistProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
