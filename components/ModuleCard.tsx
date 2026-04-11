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
        <Link
            href={`/services/${categoryKey}`}
            className="flex items-center gap-4 p-[25px] rounded-[12px] bg-white border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_18px_rgba(0,0,0,0.12)] hover:-translate-y-[5px] transition-all duration-300 cursor-pointer"
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${color}15` }}
            >
                {icon}
            </div>
            <span className="flex-1 font-semibold text-gray-800 text-[15px]">
                {label}
            </span>
            <ChevronRight size={18} className="text-gray-400" />
        </Link>
    );
}
