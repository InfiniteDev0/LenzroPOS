import { Outfit, Albert_Sans } from "next/font/google";
import { Toaster } from "sonner";
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
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${albert_sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
