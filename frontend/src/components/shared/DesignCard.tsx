import React from 'react';
import { Heart, Tag, ArrowRight } from 'lucide-react';
import type { Design } from '../../types/design';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

export interface DesignCardProps {
  design: Design;
  onOrder?: (design: Design) => void;
  onLike?: (design: Design) => void;
}

export const DesignCard: React.FC<DesignCardProps> = ({ design, onOrder, onLike }) => {
  return (
    <Card hoverEffect className="p-0 overflow-hidden flex flex-col h-full group">
      <div className="relative h-60 w-full overflow-hidden bg-slate-900">
        <img
          src={design.image}
          alt={design.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

        {/* Category tag */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/80 backdrop-blur-md text-zinc-200 border border-zinc-700">
            {design.category}
          </span>
        </div>

        {/* Like Button */}
        <button
          onClick={() => onLike?.(design)}
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-rose-400 border border-slate-800 transition-colors"
          title="Save design"
        >
          <Heart className="w-4 h-4" />
        </button>

        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-[11px] text-slate-300">By {design.tailorName}</p>
          <h4 className="text-base font-bold text-white tracking-tight leading-snug line-clamp-1">
            {design.title}
          </h4>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {design.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(Array.isArray(design.tags)
              ? design.tags
              : typeof design.tags === 'string'
              ? design.tags.split(',').map((t) => t.trim()).filter(Boolean)
              : []
            ).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 inline-flex items-center gap-1"
              >
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                {tag}
              </span>
            ))}
          </div>

        </div>

        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
              Estimated Custom
            </span>
            <span className="text-base font-extrabold text-white font-mono">
              ${design.priceEstimate}
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onOrder?.(design)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Customize
          </Button>
        </div>
      </div>
    </Card>
  );
};
