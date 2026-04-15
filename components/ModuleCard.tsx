'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ModuleCardProps {
    categoryKey: string;
    label: string;
    icon: string;
    color: string;
}

export function ModuleCard({ categoryKey, label, icon, color }: ModuleCardProps) {
    return (
        <Link href={`/services/${categoryKey}`} className="module-card">
            <div
                className="module-card-icon"
                style={{ backgroundColor: `${color}15`, color: color }}
            >
                <span className="module-card-emoji">{icon}</span>
            </div>
            <span className="module-card-label">{label}</span>
            <ChevronRight size={18} className="module-card-arrow" />
        </Link>
    );
}
