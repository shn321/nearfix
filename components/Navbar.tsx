'use client';

import Link from 'next/link';
import { MapPin, Menu } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Services', href: '/services' },
        { name: 'Admin', href: '/admin' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
            <div className="flex justify-between items-center px-[20px] py-[15px] max-w-[1400px] mx-auto w-full">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FF5C00] flex items-center justify-center shadow-md">
                        <MapPin size={18} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        Near<span className="text-[#FF5C00]">Fix</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
