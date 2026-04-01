'use client';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import Link from 'next/link';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <>
      <div className="bg-animated">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>
      <Navbar />

      <main className={styles.main}>
        <div className="container">

          {/* Hero */}
          <div className={styles.hero}>
            <span className="badge badge-primary">About AquaGuard</span>
            <h1 className={styles.heroTitle}>Protecting Water Bodies<br />Through Citizen Action</h1>
            <p className={styles.heroDesc}>
              AquaGuard is a civic technology platform that empowers citizens to report and 
              combat water body encroachments across India. By combining AI verification, 
              satellite mapping, and direct authority notification, we make environmental 
              justice accessible to everyone.
            </p>
          </div>

          {/* Mission / Vision */}
          <div className={styles.mvGrid}>
            {[
              {
                icon: '🎯',
                title: 'Our Mission',
                desc: 'To create a transparent, technology-driven pipeline from citizen observation to government action — protecting India\'s rivers, lakes, ponds, and wetlands from illegal encroachment.',
                color: 'var(--primary)',
              },
              {
                icon: '🌏',
                title: 'Our Vision',
                desc: 'A future where every water body in India is protected, every encroachment is reported and resolved, and every citizen has the tools to be an environmental guardian.',
                color: 'var(--accent)',
              },
              {
                icon: '⚖️',
                title: 'Our Commitment',
                desc: 'Zero tolerance for false reports. Our AI verification ensures only genuine complaints reach authorities, maintaining trust and efficiency in the system.',
                color: 'var(--warning)',
              },
            ].map((item, i) => (
              <div key={i} className={`glass-card ${styles.mvCard}`}>
                <div className={styles.mvIcon} style={{ background: item.color + '15' }}>
                  <span style={{ fontSize: '32px' }}>{item.icon}</span>
                </div>
                <h3 style={{ color: item.color }}>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* How It Works — Detailed */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className="badge badge-primary">Process</span>
              <h2 className="section-title">Detailed Process Flow</h2>
              <div className="divider" style={{ margin: '16px auto' }}></div>
            </div>

            <div className={styles.processFlow}>
              {[
                {
                  num: '01',
                  title: 'Photo Capture with GPS',
                  color: 'var(--primary)',
                  steps: [
                    'Open the AquaGuard website on your smartphone',
                    'Go to "Report Encroachment" page',
                    'Use your camera to photograph the encroachment site',
                    'Your GPS coordinates are captured automatically',
                    'Our system reverse-geocodes to get the exact address',
                  ],
                  tech: ['Web Camera API', 'Geolocation API', 'OpenStreetMap Nominatim'],
                },
                {
                  num: '02',
                  title: 'AI Verification',
                  color: 'var(--accent)',
                  steps: [
                    'Photo is analyzed by Google Gemini Vision AI',
                    'AI detects presence of water body (river, lake, pond, etc.)',
                    'AI identifies encroachment activity type',
                    'GPS coordinates cross-referenced with satellite imagery',
                    'Confidence score and severity level determined',
                    'Report flagged as verified/unverified with reasoning',
                  ],
                  tech: ['Google Gemini Vision', 'Satellite Imagery', 'GPS Cross-referencing'],
                },
                {
                  num: '03',
                  title: 'Authority Notification',
                  color: 'var(--warning)',
                  steps: [
                    'Verified complaint receives a unique WBE ID',
                    'Full report (photo, GPS, description, AI analysis) compiled',
                    'Email sent to designated Pollution Control Board / authority',
                    'Complaint added to live map dashboard',
                    'Reporter receives confirmation with complaint ID',
                  ],
                  tech: ['EmailJS', 'Live Map', 'Unique ID Generation'],
                },
                {
                  num: '04',
                  title: 'SLA Tracking & Resolution',
                  color: 'var(--accent-orange)',
                  steps: [
                    'Authority acknowledges within 72 hours (SLA)',
                    'Field team dispatched within 7 days',
                    'Remediation initiated within 21 days',
                    'Case resolved and marked within 30 days',
                    'Reporter notified at each stage via email',
                    'Map updated in real-time as status changes',
                  ],
                  tech: ['SLA Monitoring', 'Email Notifications', 'Real-time Dashboard'],
                },
              ].map((phase, i) => (
                <div key={i} className={styles.processPhase}>
                  <div className={styles.phaseNum} style={{ color: phase.color, borderColor: phase.color + '40' }}>
                    {phase.num}
                  </div>
                  <div className={styles.phaseContent}>
                    <h3 style={{ color: phase.color }}>{phase.title}</h3>
                    <ul className={styles.phaseSteps}>
                      {phase.steps.map((step, j) => (
                        <li key={j}>{step}</li>
                      ))}
                    </ul>
                    <div className={styles.techStack}>
                      {phase.tech.map((t, j) => (
                        <span key={j} className="badge badge-primary" style={{ fontSize: '11px' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Legal Framework */}
          <section className={styles.section} id="laws">
            <div className={styles.sectionHeader}>
              <span className="badge badge-pending">Legal</span>
              <h2 className="section-title">Legal Framework</h2>
              <p className={styles.sectionDesc}>
                Water body encroachment is a serious legal offense in India. Here are the key laws protecting our water bodies.
              </p>
            </div>

            <div className="grid-2">
              {[
                {
                  law: 'Environment Protection Act, 1986',
                  section: 'Section 5',
                  desc: 'Empowers the Central Government to take measures to protect the environment, including penalizing unauthorized activities near water bodies.',
                  penalty: 'Up to ₹1 Lakh fine + 5 years imprisonment',
                },
                {
                  law: 'Water (Prevention & Control of Pollution) Act, 1974',
                  section: 'Section 24-25',
                  desc: 'Prohibits deliberate discharge of pollutants or waste into any water body. PCBs empowered to take action.',
                  penalty: 'Up to 3 months in jail + fine',
                },
                {
                  law: 'National Green Tribunal Act, 2010',
                  section: 'Section 14',
                  desc: 'Citizens can directly approach the NGT against any activity that causes environmental damage to water bodies.',
                  penalty: 'Court-ordered remediation + compensation',
                },
                {
                  law: 'Wetlands (Conservation & Management) Rules, 2017',
                  section: 'Rule 4',
                  desc: 'Prohibits reclamation, conversion, and encroachment of wetlands. Ramsar sites have additional international protection.',
                  penalty: 'Criminal prosecution + mandatory restoration',
                },
              ].map((law, i) => (
                <div key={i} className={`glass-card ${styles.lawCard}`}>
                  <div className={styles.lawHeader}>
                    <h4>{law.law}</h4>
                    <span className="badge badge-primary">{law.section}</span>
                  </div>
                  <p className={styles.lawDesc}>{law.desc}</p>
                  <div className={styles.lawPenalty}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Penalty: {law.penalty}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tech Stack */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className="badge badge-resolved">Technology</span>
              <h2 className="section-title">Built With</h2>
            </div>
            <div className="grid-4">
              {[
                { name: 'Next.js', role: 'Web Framework', icon: '⚡' },
                { name: 'Gemini Vision', role: 'AI Analysis', icon: '🧠' },
                { name: 'Leaflet.js', role: 'Interactive Maps', icon: '🗺️' },
                { name: 'OpenStreetMap', role: 'Map Data', icon: '🌍' },
                { name: 'Nominatim', role: 'Geocoding', icon: '📍' },
                { name: 'Web Camera API', role: 'Photo Capture', icon: '📷' },
                { name: 'Geolocation API', role: 'GPS Detection', icon: '🛰️' },
                { name: 'EmailJS', role: 'Notifications', icon: '📧' },
              ].map((tech, i) => (
                <div key={i} className={`glass-card ${styles.techCard}`}>
                  <span className={styles.techIcon}>{tech.icon}</span>
                  <strong className={styles.techName}>{tech.name}</strong>
                  <span className={styles.techRole}>{tech.role}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className={styles.ctaBanner}>
            <h2>Ready to Make a Difference?</h2>
            <p>Every report matters. Be the change your river needs.</p>
            <Link href="/report" className="btn btn-primary btn-lg">
              Report an Encroachment Now
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
