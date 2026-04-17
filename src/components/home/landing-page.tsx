import Link from "next/link";
import styles from "./landing-page.module.css";

export function LandingPage() {
  return (
    <div className={styles.root}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <span className={styles.navOrb} />
          <span className={styles.navName}>GanSystems</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.navLogin}>Sign In</Link>
          <Link href="/signup" className={styles.navCta}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Nigerian Engineering Olympiad 2026 — Veritas University
        </div>
        <h1 className={styles.heroTitle}>
          Smart Farm<br />
          <span className={styles.heroAccent}>Control Hub</span>
        </h1>
        <p className={styles.heroSub}>
          Solar-powered IoT monitoring for irrigation, aquaculture, water supply,
          weed detection, and pest control — all from one dashboard.
        </p>
        <div className={styles.heroCtas}>
          <Link href="/signup" className={styles.ctaPrimary}>Launch Dashboard</Link>
          <Link href="/login" className={styles.ctaGhost}>Sign In</Link>
        </div>

        {/* Live metrics strip */}
        <div className={styles.metricsStrip}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Tank Level</span>
            <span className={styles.metricValue}>68%</span>
            <span className={styles.metricOnline} />
          </div>
          <div className={styles.metricDivider} />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Soil Moisture</span>
            <span className={styles.metricValue}>47%</span>
            <span className={styles.metricOnline} />
          </div>
          <div className={styles.metricDivider} />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Turbidity</span>
            <span className={styles.metricValue}>36 NTU</span>
            <span className={styles.metricOnline} />
          </div>
          <div className={styles.metricDivider} />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Battery</span>
            <span className={styles.metricValue}>12.4 V</span>
            <span className={styles.metricOnline} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <p className={styles.sectionEyebrow}>What GanSystems monitors</p>
        <h2 className={styles.sectionTitle}>Six subsystems. One dashboard.</h2>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <article key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <strong className={styles.statValue}>{s.value}</strong>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* CTA banner */}
      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Ready to monitor your farm?</h2>
        <p className={styles.ctaBannerSub}>Register your ESP32 controllers and start receiving live sensor data in minutes.</p>
        <Link href="/signup" className={styles.ctaPrimary}>Create Free Account</Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>© 2026 GanSystems · Veritas University · Nigerian Engineering Olympiad</span>
        <div className={styles.footerLinks}>
          <Link href="/login">Sign In</Link>
          <Link href="/signup">Sign Up</Link>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: "💧", title: "Smart Water Supply", desc: "Ultrasonic tank level sensors with automatic pump control and overflow protection." },
  { icon: "🌱", title: "Precision Irrigation", desc: "Capacitive soil moisture sensors trigger irrigation valves only when crops need water." },
  { icon: "🐟", title: "Aquaculture Monitoring", desc: "Turbidity and fish tank level sensors with auto-flush and inlet valve management." },
  { icon: "📷", title: "Weed Detection", desc: "ESP32-CAM captures field snapshots so farmers can visually inspect for weeds remotely." },
  { icon: "🦟", title: "Pest Control", desc: "Scheduled spray pump and UV zapper with RTC-driven automation and activity logging." },
  { icon: "⚡", title: "Solar Powered", desc: "Fully off-grid operation with battery voltage monitoring and 24/7 uptime." },
];

const STATS = [
  { value: "40–60%", label: "Water savings per farm" },
  { value: "20–35%", label: "Crop yield improvement" },
  { value: "₦300K+", label: "Annual diesel cost savings" },
  { value: "100K+", label: "Farms scalable nationally" },
];
