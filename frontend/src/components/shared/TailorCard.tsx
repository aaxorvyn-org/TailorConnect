import React from 'react';
import { Star, MapPin, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import type { Tailor } from '../../types/tailor';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useTranslation } from '../../i18n';

export interface TailorCardProps {
  tailor: Tailor;
  onSelect?: (tailor: Tailor) => void;
  onBook?: (tailor: Tailor) => void;
}

export const TailorCard: React.FC<TailorCardProps> = ({ tailor, onSelect, onBook }) => {
  const { t } = useTranslation();
  return (
    <Card hoverEffect className="p-0 overflow-hidden flex flex-col h-full group">
      {/* Cover Image & Badges */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        <img
          src={tailor.coverImage}
          alt={tailor.shopName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Featured Badge */}
        {tailor.featured && (
          <div className="absolute top-3 left-3 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white text-zinc-950 shadow-md">
            <Sparkles className="w-3 h-3 fill-current" />
            <span>Master Atelier</span>
          </div>
        )}

        {/* Distance / Turnaround */}
        <div className="absolute top-3 right-3 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-800">
          <Clock className="w-3 h-3 text-zinc-300" />
          <span>{tailor.turnaroundDays}d turnaround</span>
        </div>

        {/* Tailor Avatar Avatar overlapping bottom */}
        <div className="absolute -bottom-5 left-5 flex items-center space-x-3">
          <div className="relative">
            <img
              src={tailor.avatar}
              alt={tailor.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-zinc-600 shadow-lg bg-slate-900"
            />
            {tailor.verified && (
              <CheckCircle2 className="w-4 h-4 text-zinc-300 absolute -bottom-1 -right-1 fill-black" />
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="pt-8 px-5 pb-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {tailor.experienceYears} Years Craftsmanship
            </span>
            <div className="flex items-center space-x-1 text-xs font-semibold text-zinc-200">
              <Star className="w-3.5 h-3.5 fill-zinc-300 text-zinc-300" />
              <span>{tailor.rating}</span>
              <span className="text-slate-400">({tailor.reviewCount})</span>
            </div>
          </div>

          <h4 className="text-base font-bold text-white tracking-tight mt-1 group-hover:text-zinc-200 transition-colors">
            {tailor.shopName}
          </h4>
          <p className="text-xs text-slate-400 font-medium">Master: {tailor.name}</p>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-2">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              {tailor.location.area}, {tailor.location.city}
              {tailor.location.distanceKm !== undefined && ` (${tailor.location.distanceKm} km away)`}
            </span>
          </div>

          <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
            {tailor.bio}
          </p>

          {/* Specialties Pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tailor.specialties.slice(0, 3).map((item) => (
              <span
                key={item}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Footer info & Buttons */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
              {t('customer.nearby.startingAt', 'Bespoke From')}
            </span>
            <span className="text-base font-extrabold text-white font-mono">
              ${tailor.startingPrice}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onSelect && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelect(tailor)}
              >
                {t('customer.nearby.viewProfile', 'Profile')}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => (onBook ? onBook(tailor) : onSelect?.(tailor))}
            >
              {t('customer.nearby.bookConsultation', 'Consult')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
