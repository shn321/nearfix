'use client';

import Link from 'next/link';
import { CATEGORIES } from '@/data/services';

export default function ServicesPage() {
    return (
        <div className="svc-page">
            {/* Header */}
            <div className="svc-header nf-fade-in">
                <h1 className="svc-title">Available Categories</h1>
                <p className="svc-subtitle">
                    Select a service category to find providers near your location.
                </p>
            </div>

            {/* Category Grid */}
            <div className="svc-grid nf-slide-up">
                {CATEGORIES.map((cat) => (
                    <Link
                        key={cat.key}
                        href={`/services/${cat.key}`}
                        className="svc-card"
                    >
                        <div className="svc-card-inner">
                            <div
                                className="svc-card-icon"
                                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                            >
                                {cat.icon}
                            </div>
                            <h2 className="svc-card-label">{cat.label}</h2>
                            <p className="svc-card-desc">
                                Find nearby {cat.label.toLowerCase()} options
                            </p>
                            <div
                                className="svc-card-accent"
                                style={{ backgroundColor: cat.color }}
                            />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Footer */}
            <footer className="nf-footer">
                <p>Services available within Honnavar – Bhatkal region</p>
            </footer>
        </div>
    );
}
