import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Scales } from "@/components/Scales";

export const metadata: Metadata = {
  title: "WC2026 · Model Battle",
  description: "World Cup 2026 model battle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ background:"#171717",color:"#e5e5e5",fontFamily:"'JetBrains Mono',monospace" }}>
        <Scales />
        <Nav />
        <main style={{ maxWidth:960,margin:"0 auto",padding:"24px calc(5vw + 16px)" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
