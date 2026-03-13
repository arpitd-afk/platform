"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
        return;
      }

      const path = window.location.pathname;
      const role = user.role;

      // Define restricted prefixes and who CAN access them
      const restrictions: Record<string, string[]> = {
        "/super-admin": ["super_admin"],
        "/academy": ["academy_admin", "super_admin"],
        "/coach": ["coach", "academy_admin", "super_admin"],
        "/parent": ["parent", "super_admin"],
      };

      for (const [prefix, allowedRoles] of Object.entries(restrictions)) {
        if (path.startsWith(prefix) && !allowedRoles.includes(role)) {
          console.warn(`Access denied for role ${role} to ${path}`);
          const defaultPath =
            {
              student: "/student",
              parent: "/parent",
              coach: "/coach",
              academy_admin: "/academy",
              super_admin: "/super-admin",
            }[role] || "/student";
          router.replace(defaultPath);
          break;
        }
      }
    }
  }, [user, loading, router]);

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--amber)",
            }}
          />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading...
          </span>
        </div>
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 p-5 lg:p-7 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
