import CalendarRoleGuard from "./role-guard";

export default function CalendarLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}<CalendarRoleGuard /></>;
}
