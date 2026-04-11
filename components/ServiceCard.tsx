'use client';

import { Phone, Navigation, Star, MapPin, Clock } from 'lucide-react';
import { formatDistance } from '@/lib/location';
import { formatPhone, getNavigationUrl } from '@/lib/utils';

interface ServiceCardProps {
    name: string;
    address: string;
    phone: string;
    rating: number;
    distance: number;
    latitude: number;
    longitude: number;
    userLat?: number;
    userLng?: number;
}

export function ServiceCard({
    name,
    address,
    phone,
    rating,
    distance,
    latitude,
    longitude,
}: ServiceCardProps) {
    // Estimate driving time (~30 km/h average for smaller roads)
    const estimatedMinutes = Math.round((distance / 30) * 60);
    const timeLabel = estimatedMinutes < 1 ? '< 1 min' : estimatedMinutes < 60 ? `~${estimatedMinutes} min` : `~${Math.round(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`;

    const handleNavigate = () => {
        const navUrl = getNavigationUrl(latitude, longitude);
        window.open(navUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="p-[25px] rounded-[12px] bg-white border border-gray-100 space-y-3 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_18px_rgba(0,0,0,0.12)] hover:-translate-y-[5px] transition-all duration-300">
            {/* Name & Distance */}
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-gray-900 text-[22px] md:text-[26px] leading-snug">{name}</h3>
                <div className="text-right shrink-0">
                    <span className="text-[#FF5C00] font-mono font-bold text-sm block">
                        {formatDistance(distance)}
                    </span>
                    <span className="text-gray-400 text-[10px] flex items-center justify-end gap-0.5">
                        <Clock size={9} />
                        {timeLabel}
                    </span>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <span>{address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <span className="font-mono">{formatPhone(phone)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                    <span className="font-semibold text-gray-800">{rating.toFixed(1)}</span>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
                <a
                    href={`tel:${phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-[10px] px-[14px] rounded-lg bg-green-500 text-white font-semibold text-sm hover:bg-green-600 active:scale-[0.97] transition-all"
                >
                    <Phone size={15} />
                    Call
                </a>
                <button
                    onClick={handleNavigate}
                    className="flex-1 flex items-center justify-center gap-2 py-[10px] px-[14px] rounded-lg bg-[#FF5C00] text-white font-semibold text-sm hover:bg-[#e85400] active:scale-[0.97] transition-all"
                >
                    <Navigation size={15} />
                    Navigate
                </button>
            </div>
        </div>
    );
}
