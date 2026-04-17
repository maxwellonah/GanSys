"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Cpu, Settings, Leaf, MapPin, User } from "lucide-react";

import styles from "@/components/dashboard/dashboard.module.css";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

type Props = {
  user: SessionUser;
  children: React.ReactNode;
};

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/controllers", label: "Controllers", icon: Cpu, exact: false },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: true },
];

export function AppShell({ user, children }: Props) {
  const pathname = usePathname();

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brand}>
            <div className={styles.brandOrb} />
            <div>
              <p className={styles.eyebrow}>GanSystems</p>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Control Hub</h2>
            </div>
          </div>

          <nav className={styles.nav} aria-label="Dashboard navigation">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(styles.navLink, active && styles.navLinkActive)}
                >
                  <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.miniStats}>
            <div className={styles.miniStat}>
              <span className={styles.muted} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Leaf size={12} /> Farm
              </span>
              <strong>{user.farmName}</strong>
            </div>
            <div className={styles.miniStat}>
              <span className={styles.muted} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <MapPin size={12} /> Location
              </span>
              <strong>{user.location}</strong>
            </div>
          </div>
        </div>

        <div className={styles.account}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <User size={14} style={{ color: "var(--muted)" }} />
            <strong style={{ fontSize: "0.9rem" }}>{user.name}</strong>
          </div>
          <p className={styles.muted} style={{ fontSize: "0.8rem", margin: "0 0 0.7rem" }}>{user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
