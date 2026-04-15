'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Menu, X, Home, LayoutDashboard, Layers, HelpCircle, ShieldCheck, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    const navLinks = [
        { name: 'Home', href: '/', icon: <Home size={16} /> },
        { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
        { name: 'Services', href: '/services', icon: <Layers size={16} /> },
        { name: 'About', href: '/about', icon: <Info size={16} /> },
        { name: 'Track Help', href: '/help', icon: <HelpCircle size={16} /> },
        { name: 'Admin', href: '/admin', icon: <ShieldCheck size={16} /> },
    ];

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <header className="nav-header">
            <div className="nav-container">
                {/* Logo */}
                <Link href="/" className="nav-logo">
                    <div className="nav-logo-icon">
                        <MapPin size={18} />
                    </div>
                    <span className="nav-logo-text">
                        Near<span className="nav-logo-accent">Fix</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="nav-desktop">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`nav-link ${isActive(link.href) ? 'nav-link-active' : ''}`}
                        >
                            {link.name}
                            {isActive(link.href) && <span className="nav-link-indicator" />}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    className="nav-mobile-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Navigation Overlay */}
            {isMobileMenuOpen && (
                <div className="nav-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                    <nav
                        className="nav-mobile-menu nf-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`nav-mobile-link ${isActive(link.href) ? 'nav-mobile-link-active' : ''}`}
                            >
                                <span className="nav-mobile-link-icon">{link.icon}</span>
                                <span>{link.name}</span>
                                {isActive(link.href) && (
                                    <span className="nav-mobile-active-dot" />
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}
