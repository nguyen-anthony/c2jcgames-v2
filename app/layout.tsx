import type { Metadata, Viewport } from "next";
import "./globals.css";
import MuiProvider from "@/components/MuiProvider";

export const metadata: Metadata = {
  title: "C2JC Games",
  description: "Track board game interest at C2JC events",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  );
}
