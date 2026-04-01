'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/report', label: 'Report' },
    { href: '/dashboard', label: 'Map' },
    { href: '/status', label: 'Track Status' },
    { href: '/about', label: 'About' },
  ];

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00b4d8" />
                  <stop offset="100%" stopColor="#06d6a0" />
                </linearGradient>
              </defs>
              <path d="M14 3C14 3 5 10 5 17a9 9 0 0018 0c0-7-9-14-9-14z" fill="url(#logoGrad)" opacity="0.9"/>
              <path d="M14 9C14 9 9 13.5 9 17a5 5 0 0010 0c0-3.5-5-8-5-8z" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <span className={styles.logoText}>AquaGuard</span>
        </Link>

        {/* Desktop Links */}
        <div className={styles.links}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${pathname === link.href ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className={styles.cta}>
          <Link href="/report" className="btn btn-primary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M20.586 4H16l-2-3H10L8 4H3.414A1.414 1.414 0 002 5.414V19a2 2 0 002 2h16a2 2 0 002-2V5.414A1.414 1.414 0 0020.586 4z"/>
            </svg>
            Report Now
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`}></span>
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`}></span>
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/report" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
          Report Now
        </Link>
      </div>
    </nav>
  );
}
