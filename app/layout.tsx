import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "House of Doms",
  description: "Consensual D/s task and agreement management"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
