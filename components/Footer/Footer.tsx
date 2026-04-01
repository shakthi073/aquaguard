import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00b4d8" />
                    <stop offset="100%" stopColor="#06d6a0" />
                  </linearGradient>
                </defs>
                <path d="M14 3C14 3 5 10 5 17a9 9 0 0018 0c0-7-9-14-9-14z" fill="url(#footerLogoGrad)" opacity="0.9"/>
                <path d="M14 9C14 9 9 13.5 9 17a5 5 0 0010 0c0-3.5-5-8-5-8z" fill="white" opacity="0.3"/>
              </svg>
              <span>AquaGuard</span>
            </div>
            <p className={styles.tagline}>
              Protecting India's water bodies through citizen action and AI-powered verification.
            </p>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNum}>2,847</span>
                <span className={styles.statLabel}>Reports Filed</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>1,203</span>
                <span className={styles.statLabel}>Resolved</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>94%</span>
                <span className={styles.statLabel}>AI Accuracy</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className={styles.linkGroup}>
            <h4>Platform</h4>
            <Link href="/report">Report Encroachment</Link>
            <Link href="/dashboard">View Map</Link>
            <Link href="/status">Track Complaint</Link>
            <Link href="/about">How It Works</Link>
          </div>

          <div className={styles.linkGroup}>
            <h4>Resources</h4>
            <a href="https://wrd.kerala.gov.in" target="_blank" rel="noreferrer">Water Resources Dept</a>
            <a href="https://cpcb.nic.in" target="_blank" rel="noreferrer">CPCB India</a>
            <a href="https://www.moef.gov.in" target="_blank" rel="noreferrer">MoEF&CC</a>
            <a href="#laws">Legal Framework</a>
          </div>

          <div className={styles.linkGroup}>
            <h4>Emergency Hotlines</h4>
            <div className={styles.hotline}>
              <span>National Green Tribunal</span>
              <a href="tel:+911124300634">+91 11 2430 0634</a>
            </div>
            <div className={styles.hotline}>
              <span>CPCB Helpline</span>
              <a href="tel:18001116">1800 111 6</a>
            </div>
            <div className={styles.hotline}>
              <span>Pollution Control Board</span>
              <a href="tel:18001803">1800 180 3</a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© 2024 AquaGuard. Built for a cleaner, safer India. 🇮🇳</p>
          <div className={styles.bottomLinks}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
