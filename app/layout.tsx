import type { Metadata } from "next";
import "./globals.css";
import "./alpha.css";
import "./experience-layer.css";
import "./red-gold-theme.css";
import "./graffiti-font.css";
import "./entrance-light-depth.css";
import CalendarNavigation from "./calendar-navigation";
import ExperienceLayer from "./experience-layer";
import PublicDirectoryNav from "./public-directory-nav";
import QuickActions from "./quick-actions";
import AuthenticatedBackRouter from "./authenticated-back-router";
import DomCalendarSubscribe from "./dom-calendar-subscribe";
import PwaRegister from "./pwa-register";
import RoleSelectorMobileFix from "./role-selector-mobile-fix";
import RoleCardRouter from "./role-card-router";

export const metadata: Metadata = {
  title: "House of Doms",
  description: "Persönliche Plattform für einvernehmliche D/s-Dynamiken",
  manifest: "/manifest.webmanifest",
  themeColor: "#050403",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  },
  appleWebApp: { capable: true, title: "House of Doms", statusBarStyle: "black-translucent" }
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
        <DomCalendarSubscribe />
        <PwaRegister />
        <RoleSelectorMobileFix />
        <RoleCardRouter />
        {children}
      </body>
    </html>
  );
}
