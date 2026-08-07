import type { Metadata } from "next";
import "./globals.css";
import "./alpha.css";
import "./experience-layer.css";
import "./red-theme.css";
import CalendarNavigation from "./calendar-navigation";
import ExperienceLayer from "./experience-layer";
import PublicDirectoryNav from "./public-directory-nav";

export const metadata: Metadata = {
  title: "House of Doms",
  description: "Persönliche Plattform für einvernehmliche D/s-Dynamiken"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <CalendarNavigation />
        <ExperienceLayer />
        <PublicDirectoryNav />
        {children}
      </body>
    </html>
  );
}
