import Link from 'next/link';
import { MapPin, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="nf-404-page">
            <div className="nf-404-content nf-fade-in">
                <div className="nf-404-icon">
                    <MapPin size={48} />
                </div>
                <h1 className="nf-404-code">404</h1>
                <h2 className="nf-404-title">Page Not Found</h2>
                <p className="nf-404-desc">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div className="nf-404-actions">
                    <Link href="/" className="nf-btn nf-btn-primary">
                        <ArrowLeft size={16} />
                        Go Home
                    </Link>
                    <Link href="/services" className="nf-btn nf-btn-outline-refresh">
                        <Search size={16} />
                        Browse Services
                    </Link>
                </div>
            </div>
        </div>
    );
}
