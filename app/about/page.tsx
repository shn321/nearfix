'use client';

import Link from 'next/link';
import {
    MapPin, Phone, Navigation, Shield, Star,
    ArrowLeft, Heart, Smartphone, Globe,
    Users, Map, AlertTriangle, Send,
    ChevronRight, Sparkles
} from 'lucide-react';

const STEPS = [
    {
        step: 1,
        icon: <MapPin size={28} />,
        title: 'Enable Location',
        desc: 'Allow GPS access so we can find services closest to you. Your location stays on your device.',
        color: '#FF5C00',
    },
    {
        step: 2,
        icon: <Map size={28} />,
        title: 'Browse Categories',
        desc: 'Choose from 6 service types — puncture shops, mechanics, fuel stations, EV charging, hospitals, and police.',
        color: '#8B5CF6',
    },
    {
        step: 3,
        icon: <Phone size={28} />,
        title: 'Call or Navigate',
        desc: 'Instantly call the service provider or get turn-by-turn directions via Google Maps.',
        color: '#16A34A',
    },
];

const FEATURES = [
    {
        icon: <AlertTriangle size={22} />,
        title: 'Emergency SOS',
        desc: 'One-tap access to emergency numbers (112, 108, 100) and nearest hospital/police with live GPS sharing.',
        color: '#DC2626',
        bg: '#FEF2F2',
    },
    {
        icon: <Star size={22} />,
        title: 'Anonymous Reviews',
        desc: 'Rate and review services without creating an account. Help others find the best providers.',
        color: '#F59E0B',
        bg: '#FFFBEB',
    },
    {
        icon: <Send size={22} />,
        title: 'Help Requests',
        desc: 'Send a help request with your phone number and GPS location. Track status in real-time.',
        color: '#2563EB',
        bg: '#EFF6FF',
    },
    {
        icon: <Smartphone size={22} />,
        title: 'Works Offline (PWA)',
        desc: 'Install NearFix on your phone like a native app. Access cached data even without internet.',
        color: '#8B5CF6',
        bg: '#F5F3FF',
    },
    {
        icon: <Users size={22} />,
        title: 'No Login Required',
        desc: 'Use all features instantly — no sign-up, no passwords. Just open and find help.',
        color: '#16A34A',
        bg: '#F0FDF4',
    },
    {
        icon: <Globe size={22} />,
        title: 'Real-Time Data',
        desc: 'Services fetched live from OpenStreetMap combined with our curated local database for accuracy.',
        color: '#FF5C00',
        bg: '#FFF7ED',
    },
];

const STATS = [
    { value: '54+', label: 'Local Services', icon: <Navigation size={20} /> },
    { value: '6', label: 'Categories', icon: <Map size={20} /> },
    { value: '24/7', label: 'SOS Available', icon: <Shield size={20} /> },
    { value: '0', label: 'Login Required', icon: <Users size={20} /> },
];

const CATEGORIES_INFO = [
    { icon: '🛞', label: 'Puncture Shops', count: 10, color: '#F59E0B' },
    { icon: '🔧', label: 'Mechanics', count: 10, color: '#FF5C00' },
    { icon: '⛽', label: 'Fuel Stations', count: 10, color: '#22C55E' },
    { icon: '🔋', label: 'EV Charging', count: 7, color: '#8B5CF6' },
    { icon: '🏥', label: 'Hospitals', count: 11, color: '#EF4444' },
    { icon: '🚔', label: 'Police Stations', count: 6, color: '#3B82F6' },
];

export default function AboutPage() {
    return (
        <div className="about-page">
            {/* ─── Hero ─── */}
            <section className="about-hero nf-fade-in">
                <Link href="/" className="about-back-link">
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>
                <div className="about-hero-badge">
                    <Sparkles size={14} />
                    College Project — Built with Purpose
                </div>
                <h1 className="about-hero-title">
                    About <span className="nf-accent">NearFix</span>
                </h1>
                <p className="about-hero-desc">
                    NearFix is a location-based emergency and everyday service finder
                    designed for the <strong>Honnavar to Bhatkal</strong> region in
                    Karnataka, India. We help travelers and locals instantly find the
                    nearest mechanics, fuel stations, hospitals, and more — no login required.
                </p>
            </section>

            {/* ─── Stats ─── */}
            <section className="about-stats nf-slide-up">
                {STATS.map((s, i) => (
                    <div key={i} className="about-stat-card">
                        <div className="about-stat-icon">{s.icon}</div>
                        <span className="about-stat-value">{s.value}</span>
                        <span className="about-stat-label">{s.label}</span>
                    </div>
                ))}
            </section>

            {/* ─── How It Works ─── */}
            <section className="about-section nf-slide-up">
                <h2 className="about-section-title">
                    <span className="about-title-bar" />
                    How It Works
                </h2>
                <div className="about-steps">
                    {STEPS.map((step, i) => (
                        <div key={i} className="about-step">
                            <div className="about-step-number" style={{ background: step.color }}>
                                {step.step}
                            </div>
                            <div
                                className="about-step-icon"
                                style={{ color: step.color, background: `${step.color}12` }}
                            >
                                {step.icon}
                            </div>
                            <h3 className="about-step-title">{step.title}</h3>
                            <p className="about-step-desc">{step.desc}</p>
                            {i < STEPS.length - 1 && (
                                <div className="about-step-connector">
                                    <ChevronRight size={16} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Features ─── */}
            <section className="about-section nf-slide-up">
                <h2 className="about-section-title">
                    <span className="about-title-bar" />
                    Key Features
                </h2>
                <div className="about-features-grid">
                    {FEATURES.map((f, i) => (
                        <div key={i} className="about-feature-card">
                            <div
                                className="about-feature-icon"
                                style={{ color: f.color, background: f.bg }}
                            >
                                {f.icon}
                            </div>
                            <h3 className="about-feature-title">{f.title}</h3>
                            <p className="about-feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Coverage ─── */}
            <section className="about-section nf-slide-up">
                <h2 className="about-section-title">
                    <span className="about-title-bar" />
                    Coverage Area
                </h2>
                <div className="about-coverage">
                    <div className="about-coverage-map">
                        <iframe
                            title="NearFix Coverage Area"
                            width="100%"
                            height="280"
                            style={{ border: 0, borderRadius: '16px' }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src="https://www.openstreetmap.org/export/embed.html?bbox=74.35%2C13.85%2C74.65%2C14.40&layer=mapnik&marker=14.09%2C74.50"
                        />
                    </div>
                    <div className="about-coverage-info">
                        <div className="about-coverage-badge">
                            <MapPin size={14} />
                            Honnavar — Bhatkal Corridor
                        </div>
                        <p className="about-coverage-desc">
                            NearFix covers approximately <strong>60 km</strong> along the NH-66 highway
                            from Honnavar to Bhatkal, including Murdeshwar and Shirali. All services
                            are verified with real addresses and phone numbers.
                        </p>
                        <div className="about-categories-list">
                            {CATEGORIES_INFO.map((cat, i) => (
                                <div key={i} className="about-category-chip">
                                    <span>{cat.icon}</span>
                                    <span className="about-category-label">{cat.label}</span>
                                    <span
                                        className="about-category-count"
                                        style={{ color: cat.color, background: `${cat.color}15` }}
                                    >
                                        {cat.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Tech Stack ─── */}
            <section className="about-section nf-slide-up">
                <h2 className="about-section-title">
                    <span className="about-title-bar" />
                    Built With
                </h2>
                <div className="about-tech-grid">
                    {[
                        { name: 'Next.js 15', desc: 'React framework' },
                        { name: 'TypeScript', desc: 'Type-safe code' },
                        { name: 'SQLite', desc: 'Local database' },
                        { name: 'OpenStreetMap', desc: 'Live service data' },
                        { name: 'Lucide Icons', desc: 'Modern iconography' },
                        { name: 'PWA', desc: 'Installable app' },
                    ].map((tech, i) => (
                        <div key={i} className="about-tech-card">
                            <span className="about-tech-name">{tech.name}</span>
                            <span className="about-tech-desc">{tech.desc}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="about-cta nf-slide-up">
                <Heart size={28} className="about-cta-icon" />
                <h2 className="about-cta-title">Ready to find help nearby?</h2>
                <p className="about-cta-desc">
                    Enable your location and discover services within seconds.
                </p>
                <Link href="/" className="nf-btn nf-btn-primary about-cta-btn">
                    <MapPin size={18} />
                    Go to NearFix
                </Link>
            </section>

            {/* ─── Footer ─── */}
            <footer className="about-footer">
                <p>© 2026 NearFix — A college project for the Honnavar–Bhatkal region</p>
                <p className="about-footer-sub">Built with ❤️ for the community</p>
            </footer>
        </div>
    );
}
