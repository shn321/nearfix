'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Layers, Navigation, LayoutGrid } from 'lucide-react';
import { CATEGORIES } from '@/data/services';
import { getServices } from '@/lib/serviceStore';
import type { Service } from '@/data/services';

export default function DashboardPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getServices();
                setServices(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="dash-page">
            {/* Header */}
            <div className="dash-header nf-fade-in">
                <h1 className="dash-title">Dashboard</h1>
                <p className="dash-subtitle">Overview of NearFix platform</p>
            </div>

            {/* Stats Grid */}
            <div className="dash-stats nf-slide-up">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                        <Layers size={24} />
                    </div>
                    <p className="dash-stat-label">Categories</p>
                    <p className="dash-stat-value">{CATEGORIES.length}</p>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                        <Navigation size={24} />
                    </div>
                    <p className="dash-stat-label">Total Services</p>
                    <p className="dash-stat-value">{loading ? '...' : services.length}</p>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                        <MapPin size={24} />
                    </div>
                    <p className="dash-stat-label">Region</p>
                    <p className="dash-stat-value dash-stat-value-sm">Honnavar &ndash; Bhatkal</p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="dash-section nf-slide-up-delay">
                <h2 className="dash-section-title">
                    <LayoutGrid size={20} />
                    Quick Links
                </h2>
                <div className="dash-links">
                    <Link href="/" className="dash-link-card">
                        <MapPin size={18} />
                        <span>Home</span>
                    </Link>
                    <Link href="/services" className="dash-link-card">
                        <Layers size={18} />
                        <span>Browse Services</span>
                    </Link>
                    <Link href="/admin/login" className="dash-link-card">
                        <Navigation size={18} />
                        <span>Admin Panel</span>
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="nf-footer">
                <p>NearFix Dashboard &mdash; Honnavar to Bhatkal region</p>
            </footer>
        </div>
    );
}
