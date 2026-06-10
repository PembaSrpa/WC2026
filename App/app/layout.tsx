import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Scales } from "@/components/Scales";

export const metadata: Metadata = {
  title: "WC2026 Predict",
  description: "World Cup 2026 prediction competition",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background:"#171717",color:"#e5e5e5",fontFamily:"'JetBrains Mono',monospace" }}>
        <Scales />
        <Nav />
        <main style={{ maxWidth:960,margin:"0 auto",padding:"32px 60px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
