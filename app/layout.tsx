import type { Metadata } from "next";
import "./globals.css";
import "./alpha.css";

export const metadata: Metadata = {
  title: "House of Doms",
  description: "Persönliche Plattform für einvernehmliche D/s-Dynamiken"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
