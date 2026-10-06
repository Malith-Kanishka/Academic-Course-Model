import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import slide1 from '../assets/01.jpg';
import slide2 from '../assets/02.jpg';
import slide3 from '../assets/03.jpg';
import slide4 from '../assets/04.jpg';

/* ─── Slide data ─────────────────────────────────────────── */
const slides = [
  {
    img: slide1,
    headline: 'Learn Smarter,\nNot Harder.+text',
    sub: 'Your AI study companion is ready whenever you are.',
  },
  {
    img: slide2,
    headline: 'AI Tutoring\nOn Demand.',
    sub: 'Instant explanations, personalised to your pace and level.',
  },
  {
    img: slide3,
    headline: 'Track Your\nMastery.',
    sub: 'See exactly where you excel and where to focus next.',
  },
  {
    img: slide4,
    headline: 'Study Sessions\nThat Adapt.',
    sub: 'Every session is tailored to close your knowledge gaps.',
  },
];

/* ─── Feature cards (student-facing) ────────────────────── */
const features = [
  {
    icon: '🤖',
    title: 'AI Tutor Sessions',
    desc: 'Start a live chat with your AI tutor for any topic — ask questions, get step-by-step explanations, and drill practice problems.',
    badge: 'Available 24 / 7',
    color: '#3b82f6',
  },
  {
    icon: '📊',
    title: 'Personalised Dashboard',
    desc: 'Your personal progress map shows mastery scores per topic so you always know what to study next.',
    badge: 'Real-time',
    color: '#8b5cf6',
  },
  {
    icon: '📝',
    title: 'Session Transcripts',
    desc: 'Every tutoring conversation is saved so you can revisit explanations, bookmark key moments, and share notes.',
    badge: 'Auto-saved',
    color: '#06b6d4',
  },
  {
    icon: '🎯',
    title: 'Adaptive Study Plans',
    desc: 'ACM analyses your weak areas and generates a targeted study plan reviewed by your lecturer before it reaches you.',
    badge: 'AI-powered',
    color: '#f59e0b',
  },
  {
    icon: '🏆',
    title: 'Topic Mastery Badges',
    desc: 'Earn badges as you complete modules. Track streaks, celebrate milestones, and stay motivated throughout the semester.',
    badge: 'Gamified',
    color: '#10b981',
  },
  {
    icon: '🔔',
    title: 'Smart Reminders',
    desc: 'Get nudges to review topics before exams based on the spaced-repetition algorithm — study at the perfect moment.',
    badge: 'Intelligent',
    color: '#ef4444',
  },
];



/* ─── How it works steps ─────────────────────────────────── */
const steps = [
  { n: '01', title: 'Log in with your university account', desc: 'One click with your existing university credentials — no new sign-up needed.' },
  { n: '02', title: 'Pick a topic or start a session', desc: 'Choose from your enrolled modules or let the AI recommend what to tackle today.' },
  { n: '03', title: 'Chat with your AI tutor', desc: 'Ask questions in plain language. Get clear explanations, worked examples, and quiz questions.' },
  { n: '04', title: 'Track your progress', desc: 'Watch your mastery scores climb. Your lecturer sees the same data and can step in when needed.' },
];

/* ══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 600);
  };

  const next = () => goTo((current + 1) % slides.length);
  const prev = () => goTo((current - 1 + slides.length) % slides.length);

  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timerRef.current);
  }, []);

  const slide = slides[current];

  return (
    <div className="acm-landing">
      <LandingStyles />

      {/* ── NAV ────────────────────────────────────────────── */}
      <nav className="acm-nav">
        <div className="acm-nav-inner">
          <div className="acm-brand">
            <div className="acm-brand-icon"><span>A</span></div>
            <div className="acm-brand-text">
              <span className="acm-brand-eyebrow">Academic Course Model</span>
              <span className="acm-brand-name">AI Learning Platform</span>
            </div>
          </div>
          <ul className="acm-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#stats">About</a></li>
          </ul>
          <Link to="/login" className="acm-nav-cta">Student Login →</Link>
        </div>
      </nav>

      {/* ── HERO SLIDESHOW ────────────────────────────────── */}
      <section className="acm-hero">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`acm-slide${i === current ? ' acm-slide-active' : ''}`}
            style={{ backgroundImage: `url(${s.img})` }}
          />
        ))}
        <div className="acm-hero-overlay" />

        <div className={`acm-hero-content${animating ? ' acm-content-fade' : ''}`}>
          <span className="acm-hero-eyebrow">✦ Your AI Study Companion</span>
          <h1 className="acm-hero-headline">
            {slide.headline.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </h1>
          <p className="acm-hero-sub">{slide.sub}</p>
          <div className="acm-hero-actions">
            <Link to="/login" className="acm-btn-primary">Start Studying →</Link>
            <a href="#how-it-works" className="acm-btn-ghost">See how it works</a>
          </div>
        </div>

        <button className="acm-arrow acm-arrow-left" onClick={prev} aria-label="Previous">&#8592;</button>
        <button className="acm-arrow acm-arrow-right" onClick={next} aria-label="Next">&#8594;</button>

        <div className="acm-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`acm-dot${i === current ? ' acm-dot-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="acm-scroll-hint">
          <div className="acm-scroll-mouse"><div className="acm-scroll-wheel" /></div>
          <span>Scroll to explore</span>
        </div>
      </section>



      {/* ── FEATURES GRID ─────────────────────────────────── */}
      <section id="features" className="acm-section">
        <div className="acm-section-inner">
          <div className="acm-section-header">
            <span className="acm-section-eyebrow">What you get</span>
            <h2 className="acm-section-title">
              Everything a student needs<br />
              <span className="acm-gradient-text">in one smart platform.</span>
            </h2>
            <p className="acm-section-desc">
              ACM combines AI tutoring, progress tracking, and adaptive study plans — all connected with your university's academic team.
            </p>
          </div>
          <div className="acm-feature-grid">
            {features.map(({ icon, title, desc, badge, color }) => (
              <div key={title} className="acm-feature-card" style={{ '--accent': color }}>
                <div className="acm-feature-icon" style={{ background: `${color}18`, color }}>{icon}</div>
                <span className="acm-feature-badge" style={{ background: `${color}18`, color }}>{badge}</span>
                <h3 className="acm-feature-title">{title}</h3>
                <p className="acm-feature-desc">{desc}</p>
                <div className="acm-feature-line" style={{ background: color }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how-it-works" className="acm-section acm-section-dark">
        <div className="acm-section-inner">
          <div className="acm-section-header">
            <span className="acm-section-eyebrow acm-eyebrow-light">Simple steps</span>
            <h2 className="acm-section-title acm-title-light">
              From login to mastery<br />
              <span className="acm-gradient-text">in four steps.</span>
            </h2>
          </div>
          <div className="acm-steps">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="acm-step">
                <div className="acm-step-num">{n}</div>
                <div className="acm-step-body">
                  <h3 className="acm-step-title">{title}</h3>
                  <p className="acm-step-desc">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <section className="acm-cta-banner">
        <div className="acm-cta-glow" />
        <div className="acm-cta-inner">
          <h2 className="acm-cta-title">Ready to ace your semester?</h2>
          <p className="acm-cta-sub">Log in with your university account and start your first AI tutor session in under a minute.</p>
          <Link to="/login" className="acm-btn-primary acm-btn-large">Get Started Free →</Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="acm-footer">
        <div className="acm-footer-inner">
          <div className="acm-footer-brand">
            <div className="acm-brand-icon"><span>A</span></div>
            <div>
              <p className="acm-footer-name">Academic Course Model</p>
              <p className="acm-footer-tagline">AI-powered learning for every student.</p>
            </div>
          </div>
          <p className="acm-footer-copy">© {new Date().getFullYear()} Academic Course Model. Built for students who aim higher.</p>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
function LandingStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

      .acm-landing {
        font-family: 'Inter', system-ui, sans-serif;
        color: #0f172a;
        background: #f8fafc;
        overflow-x: hidden;
        scroll-behavior: smooth;
      }

      /* NAV */
      .acm-nav {
        position: fixed; top: 0; left: 0; right: 0; z-index: 100;
        padding: 0 24px;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      .acm-nav-inner {
        max-width: 1280px; margin: 0 auto;
        display: flex; align-items: center; justify-content: space-between;
        height: 68px; gap: 24px;
      }
      .acm-brand { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
      .acm-brand-icon {
        width: 40px; height: 40px; border-radius: 10px;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        display: flex; align-items: center; justify-content: center;
        font-weight: 900; font-size: 20px; color: #fff;
        box-shadow: 0 4px 14px rgba(99,102,241,0.5);
      }
      .acm-brand-text { display: flex; flex-direction: column; }
      .acm-brand-eyebrow {
        font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
        text-transform: uppercase; color: #93c5fd; line-height: 1;
      }
      .acm-brand-name { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.3; }
      .acm-nav-links {
        display: flex; gap: 32px; list-style: none; margin: 0; padding: 0;
      }
      .acm-nav-links a {
        font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.75);
        text-decoration: none; transition: color 0.2s;
      }
      .acm-nav-links a:hover { color: #fff; }
      .acm-nav-cta {
        flex-shrink: 0;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        color: #fff; font-size: 14px; font-weight: 700;
        padding: 10px 20px; border-radius: 10px; text-decoration: none;
        transition: opacity 0.2s, transform 0.15s;
        box-shadow: 0 4px 14px rgba(99,102,241,0.4);
      }
      .acm-nav-cta:hover { opacity: 0.9; transform: translateY(-1px); }

      /* HERO */
      .acm-hero {
        position: relative; height: 100vh; min-height: 600px;
        overflow: hidden; display: flex; align-items: center; justify-content: center;
      }
      .acm-slide {
        position: absolute; inset: 0;
        background-size: cover; background-position: center;
        opacity: 0; transition: opacity 1s ease;
        transform: scale(1.06);
      }
      .acm-slide-active {
        opacity: 1;
        animation: acm-ken-burns 8s ease-out forwards;
      }
      @keyframes acm-ken-burns {
        from { transform: scale(1.08); }
        to   { transform: scale(1.0); }
      }
      .acm-hero-overlay {
        position: absolute; inset: 0; z-index: 2;
        background: linear-gradient(
          to right,
          rgba(2,8,30,0.82) 0%,
          rgba(2,8,30,0.55) 55%,
          rgba(2,8,30,0.25) 100%
        );
      }
      .acm-hero-content {
        position: relative; z-index: 3;
        width: 100%; max-width: 1280px; padding: 0 48px;
        transition: opacity 0.4s ease;
      }
      .acm-content-fade { opacity: 0; }
      .acm-hero-eyebrow {
        display: inline-block;
        font-size: 13px; font-weight: 700; letter-spacing: 0.18em;
        text-transform: uppercase; color: #93c5fd;
        margin-bottom: 18px;
        background: rgba(59,130,246,0.15); padding: 6px 14px;
        border-radius: 100px; border: 1px solid rgba(147,197,253,0.25);
      }
      .acm-hero-headline {
        font-size: clamp(42px, 6vw, 80px); font-weight: 900;
        line-height: 1.05; color: #fff; margin: 0 0 20px 0;
        letter-spacing: -0.02em; max-width: 700px;
        text-shadow: 0 2px 20px rgba(0,0,0,0.4);
      }
      .acm-hero-sub {
        font-size: clamp(16px, 2vw, 20px); font-weight: 400;
        color: rgba(255,255,255,0.8); margin: 0 0 36px 0;
        max-width: 480px; line-height: 1.65;
      }
      .acm-hero-actions { display: flex; gap: 16px; flex-wrap: wrap; }

      /* Buttons */
      .acm-btn-primary {
        display: inline-flex; align-items: center; gap: 8px;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        color: #fff; font-size: 15px; font-weight: 700;
        padding: 14px 28px; border-radius: 12px; text-decoration: none;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 6px 24px rgba(99,102,241,0.45);
      }
      .acm-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(99,102,241,0.55); }
      .acm-btn-large { font-size: 17px; padding: 16px 36px; }
      .acm-btn-ghost {
        display: inline-flex; align-items: center;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.25);
        color: #fff; font-size: 15px; font-weight: 600;
        padding: 14px 28px; border-radius: 12px; text-decoration: none;
        transition: background 0.2s; backdrop-filter: blur(8px);
      }
      .acm-btn-ghost:hover { background: rgba(255,255,255,0.18); }

      /* Arrows */
      .acm-arrow {
        position: absolute; top: 50%; transform: translateY(-50%); z-index: 5;
        width: 48px; height: 48px; border-radius: 50%;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.22);
        color: #fff; font-size: 20px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, transform 0.15s;
        backdrop-filter: blur(8px);
      }
      .acm-arrow:hover { background: rgba(255,255,255,0.25); transform: translateY(-50%) scale(1.08); }
      .acm-arrow-left { left: 28px; }
      .acm-arrow-right { right: 28px; }

      /* Dots */
      .acm-dots {
        position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
        z-index: 5; display: flex; gap: 10px;
      }
      .acm-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: rgba(255,255,255,0.4);
        border: none; cursor: pointer;
        transition: background 0.25s, transform 0.25s, width 0.25s;
        padding: 0;
      }
      .acm-dot-active {
        background: #fff; transform: scale(1.1); width: 24px; border-radius: 6px;
      }

      /* Scroll hint */
      .acm-scroll-hint {
        position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
        z-index: 5; display: flex; flex-direction: column; align-items: center;
        gap: 8px; color: rgba(255,255,255,0.5);
        font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
      }
      .acm-scroll-mouse {
        width: 24px; height: 38px;
        border: 2px solid rgba(255,255,255,0.35); border-radius: 12px;
        display: flex; justify-content: center; padding-top: 6px;
      }
      .acm-scroll-wheel {
        width: 4px; height: 8px;
        background: rgba(255,255,255,0.6); border-radius: 2px;
        animation: acm-scroll 1.8s ease-in-out infinite;
      }
      @keyframes acm-scroll {
        0%   { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(12px); opacity: 0; }
      }



      /* SECTION commons */
      .acm-section { padding: 96px 24px; }
      .acm-section-dark { background: linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%); }
      .acm-section-inner { max-width: 1280px; margin: 0 auto; }
      .acm-section-header { text-align: center; margin-bottom: 64px; }
      .acm-section-eyebrow {
        display: inline-block; font-size: 12px; font-weight: 700;
        letter-spacing: 0.2em; text-transform: uppercase; color: #6366f1; margin-bottom: 16px;
      }
      .acm-eyebrow-light { color: #93c5fd; }
      .acm-section-title {
        font-size: clamp(28px, 4vw, 46px); font-weight: 900; line-height: 1.15;
        color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.02em;
      }
      .acm-title-light { color: #f1f5f9; }
      .acm-section-desc {
        font-size: 17px; color: #64748b; max-width: 560px;
        margin: 0 auto; line-height: 1.7;
      }
      .acm-gradient-text {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6, #f59e0b);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      }

      /* FEATURE GRID */
      .acm-feature-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;
      }
      .acm-feature-card {
        position: relative; background: #fff;
        border: 1px solid #e2e8f0; border-radius: 20px;
        padding: 28px; transition: transform 0.2s, box-shadow 0.2s;
        overflow: hidden; display: flex; flex-direction: column; gap: 10px;
      }
      .acm-feature-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 48px rgba(15,23,42,0.1);
        border-color: var(--accent);
      }
      .acm-feature-icon {
        width: 52px; height: 52px; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        font-size: 26px; margin-bottom: 4px;
      }
      .acm-feature-badge {
        display: inline-flex; font-size: 11px; font-weight: 700;
        padding: 4px 10px; border-radius: 100px; width: fit-content;
        letter-spacing: 0.05em; text-transform: uppercase;
      }
      .acm-feature-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
      .acm-feature-desc { font-size: 14px; color: #64748b; line-height: 1.65; margin: 0; flex: 1; }
      .acm-feature-line {
        height: 3px; border-radius: 2px; margin-top: 8px;
        opacity: 0; transition: opacity 0.2s;
      }
      .acm-feature-card:hover .acm-feature-line { opacity: 1; }

      /* HOW IT WORKS */
      .acm-steps {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 32px;
      }
      .acm-step { display: flex; gap: 20px; align-items: flex-start; }
      .acm-step-num {
        flex-shrink: 0; width: 52px; height: 52px; border-radius: 14px;
        background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2));
        border: 1px solid rgba(99,102,241,0.25);
        display: flex; align-items: center; justify-content: center;
        font-size: 15px; font-weight: 900; color: #93c5fd; letter-spacing: 0.05em;
      }
      .acm-step-body { flex: 1; }
      .acm-step-title { font-size: 16px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px 0; line-height: 1.4; }
      .acm-step-desc { font-size: 14px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.65; }

      /* CTA BANNER */
      .acm-cta-banner {
        position: relative; overflow: hidden;
        background: linear-gradient(135deg, #1e3a5f, #1e1b4b 50%, #0f172a);
        padding: 96px 24px; text-align: center;
      }
      .acm-cta-glow {
        position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
        width: 600px; height: 400px;
        background: radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%);
        pointer-events: none;
      }
      .acm-cta-inner {
        position: relative; max-width: 640px; margin: 0 auto;
        display: flex; flex-direction: column; align-items: center; gap: 20px;
      }
      .acm-cta-title {
        font-size: clamp(28px, 4vw, 46px); font-weight: 900; color: #fff;
        margin: 0; line-height: 1.15;
      }
      .acm-cta-sub { font-size: 17px; color: rgba(255,255,255,0.6); margin: 0; line-height: 1.65; }

      /* FOOTER */
      .acm-footer { background: #020817; padding: 36px 24px; }
      .acm-footer-inner {
        max-width: 1280px; margin: 0 auto;
        display: flex; align-items: center; justify-content: space-between;
        flex-wrap: wrap; gap: 20px;
      }
      .acm-footer-brand { display: flex; align-items: center; gap: 14px; }
      .acm-footer-name { font-size: 14px; font-weight: 700; color: #f1f5f9; margin: 0; }
      .acm-footer-tagline { font-size: 12px; color: rgba(255,255,255,0.35); margin: 2px 0 0 0; }
      .acm-footer-copy { font-size: 12px; color: rgba(255,255,255,0.3); margin: 0; }

      /* Responsive */
      @media (max-width: 768px) {
        .acm-nav-links { display: none; }
        .acm-hero-content { padding: 0 24px; }
        .acm-arrow { display: none; }
        .acm-stat { min-width: 140px; padding: 20px 16px; }
        .acm-stat-value { font-size: 28px; }
        .acm-steps { grid-template-columns: 1fr; }
        .acm-footer-inner { flex-direction: column; text-align: center; }
      }
    `}</style>
  );
}