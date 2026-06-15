import { Link } from 'react-router'

const styles = {
  hero: {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
    color: '#fff',
  },
  heroTagline: {
    fontSize: '2.5rem',
    fontWeight: 700,
    margin: '0 0 1rem',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    maxWidth: '600px',
    margin: '0 auto 2rem',
    opacity: 0.9,
  },
  cta: {
    display: 'inline-block',
    padding: '0.75rem 2rem',
    background: '#fff',
    color: '#2d6a4f',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '1.1rem',
    textDecoration: 'none',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '2rem',
    padding: '4rem 2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  featureCard: {
    textAlign: 'center' as const,
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  featureIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  featureTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0 0 0.5rem',
  },
  featureDesc: {
    fontSize: '0.9rem',
    color: '#555',
    margin: 0,
  },
  testimonials: {
    background: '#f8f9fa',
    padding: '4rem 2rem',
    textAlign: 'center' as const,
  },
  testimonialHeading: {
    fontSize: '1.8rem',
    fontWeight: 600,
    marginBottom: '2rem',
  },
  testimonialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    maxWidth: '800px',
    margin: '0 auto',
  },
  testimonialCard: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    fontStyle: 'italic' as const,
    color: '#444',
  },
  footer: {
    padding: '2rem',
    textAlign: 'center' as const,
    borderTop: '1px solid #e0e0e0',
    color: '#666',
    fontSize: '0.9rem',
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    marginBottom: '1rem',
  },
  footerLink: {
    color: '#2d6a4f',
    textDecoration: 'none',
  },
}

const features = [
  { icon: '🪺', title: 'Nests', desc: 'Join small groups of like-minded empty nesters near you.' },
  {
    icon: '🎯',
    title: 'Activities',
    desc: 'Discover curated experiences — from hiking to cooking classes.',
  },
  {
    icon: '💬',
    title: 'Discussions',
    desc: 'Share stories, advice, and laughs with your community.',
  },
  {
    icon: '🤝',
    title: 'Partner Groups',
    desc: 'Connect with couples navigating the same chapter of life.',
  },
]

export function Landing() {
  return (
    <div>
      <section style={styles.hero}>
        <h1 style={styles.heroTagline}>Rediscover Adventure Together</h1>
        <p style={styles.heroSubtitle}>
          The nest is empty, but life is full. Find new experiences, build friendships, and embrace
          this exciting chapter with fellow empty nesters.
        </p>
        <Link to="/signup" style={styles.cta}>
          Join the Flock
        </Link>
      </section>

      <section style={styles.features}>
        {features.map((f) => (
          <div key={f.title} style={styles.featureCard}>
            <div style={styles.featureIcon}>{f.icon}</div>
            <h3 style={styles.featureTitle}>{f.title}</h3>
            <p style={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </section>

      <section style={styles.testimonials}>
        <h2 style={styles.testimonialHeading}>What Our Members Say</h2>
        <div style={styles.testimonialGrid}>
          <div style={styles.testimonialCard}>
            "We found our hiking group here and haven't looked back!"
          </div>
          <div style={styles.testimonialCard}>
            "Finally, a community that gets what this phase of life is really about."
          </div>
          <div style={styles.testimonialCard}>
            "The best decision we made after the kids left was joining a Nest."
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerLinks}>
          <a href="#" style={styles.footerLink}>
            About
          </a>
          <a href="#" style={styles.footerLink}>
            Privacy
          </a>
          <a href="#" style={styles.footerLink}>
            Terms
          </a>
          <a href="#" style={styles.footerLink}>
            Contact
          </a>
        </div>
        <p>&copy; 2025 Empty Nesters Club. All rights reserved.</p>
      </footer>
    </div>
  )
}
