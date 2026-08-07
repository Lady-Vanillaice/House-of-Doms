import type { Metadata } from "next";
import "./globals.css";
import "./alpha.css";
import "./experience-layer.css";
import "./red-gold-theme.css";
import "./graffiti-font.css";
import CalendarNavigation from "./calendar-navigation";
import ExperienceLayer from "./experience-layer";
import PublicDirectoryNav from "./public-directory-nav";
import QuickActions from "./quick-actions";
import AuthenticatedBackRouter from "./authenticated-back-router";

export const metadata: Metadata = {
  title: "House of Doms",
  description: "Persönliche Plattform für einvernehmliche D/s-Dynamiken"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <AuthenticatedBackRouter />
        <CalendarNavigation />
        <ExperienceLayer />
        <PublicDirectoryNav />
        <QuickActions />
        {children}
      </body>
    </html>
  );
}
