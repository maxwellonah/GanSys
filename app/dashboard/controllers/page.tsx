import Link from "next/link";
import { Cpu } from "lucide-react";

import styles from "@/components/dashboard/dashboard.module.css";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/data";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  if (status === "online") return styles.online;
  if (status === "stale") return styles.stale;
  return styles.offline;
}

export default async function ControllersPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const snapshot = await getDashboardSnapshot(user.id);

  return (
    <>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Controller directory</p>
          <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Registered ESP32 controllers</h1>
          <p className={styles.muted} style={{ margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
            Browse every controller connected to your dashboard and jump straight into a device detail view.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Cpu size={16} style={{ color: "var(--muted)" }} />
            <div>
              <p className={styles.eyebrow}>Controllers</p>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
                {snapshot.controllers.length} registered controller{snapshot.controllers.length === 1 ? "" : "s"}
              </h2>
            </div>
          </div>
        </div>

        <div className={styles.controllerGrid}>
          {snapshot.controllers.length ? (
            snapshot.controllers.map((controller) => (
              <article key={controller.id} className={styles.controllerCard}>
                <div className={styles.cardHead}>
                  <div>
                    <p className={styles.eyebrow}>{controller.location}</p>
                    <h3>{controller.name}</h3>
                    <p className={styles.muted}>
                      {controller.hardwareId} / Last seen {formatRelativeTime(controller.lastSeenAt)}
                    </p>
                  </div>
                  <span className={`${styles.status} ${statusClass(controller.status)}`}>{controller.status}</span>
                </div>

                <div className={styles.tags}>
                  <span className={styles.tag}>{controller.channelCount} channels</span>
                  <span className={styles.tag}>{controller.sensorCount} sensors</span>
                  <span className={styles.tag}>{controller.actuatorCount} actuators</span>
                  <span className={styles.tag}>{controller.openAlertCount} open alerts</span>
                </div>

                <p className={styles.muted}>{controller.description || "No description yet."}</p>

                <div className={styles.rowBetween}>
                  <div className={styles.muted}>
                    <strong>{controller.firmwareVersion}</strong>
                    <div className={styles.small}>Firmware</div>
                  </div>
                  <Link className={styles.button} href={`/dashboard/controllers/${controller.id}`}>
                    Open Controller
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className={styles.empty}>No controllers yet. Open Settings to register your first ESP32.</div>
          )}
        </div>
      </section>
    </>
  );
}
