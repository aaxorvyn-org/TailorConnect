import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '@tailorconnect/api-client';
import type { BusinessSummaryDto, ServiceCategoryDto } from '@tailorconnect/types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState, Skeleton } from '../components/ui/EmptyState';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Clock,
  ArrowRight,
} from 'lucide-react';

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [radiusKm, setRadiusKm] = useState(25);
  const [pickupOnly, setPickupOnly] = useState(false);

  const [businesses, setBusinesses] = useState<BusinessSummaryDto[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories taxonomy
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.services.getCategories();
        if (res.success && res.data) setCategories(res.data);
      } catch {}
    }
    loadCategories();
  }, []);

  // Search tailors
  const fetchTailors = async () => {
    setIsLoading(true);
    try {
      const res = await api.discovery.search({
        q: query || undefined,
        category: selectedCategory || undefined,
        radiusKm,
        pickupOnly,
      });
      if (res.success && res.data) {
        setBusinesses(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTailors();
  }, [selectedCategory, radiusKm, pickupOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTailors();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Search Bar */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Matching Tailors Near You
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Showing verified studios and master tailors in Hyderabad with capability matching.
        </p>

        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by garment (e.g. Blouse, Sherwani, Lehenga, Alteration)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <Button type="submit" size="md">
            Search
          </Button>
        </form>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/80">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors select-none ${
            selectedCategory === ''
              ? 'bg-slate-900 text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          All Garments
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors select-none ${
              selectedCategory === cat.slug
                ? 'bg-slate-900 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
        <button
          onClick={() => setPickupOnly(!pickupOnly)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors select-none ml-auto flex items-center gap-1 ${
            pickupOnly ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <MapPin className="w-3 h-3" />
          Home Pickup Available
        </button>
      </div>

      {/* Results grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-stone-200 p-4 space-y-3 bg-white">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={<Search className="w-6 h-6 text-stone-400" />}
          title="No matching studios found"
          description="We couldn't find a studio matching your exact filters in this search radius. Try adjusting requirements or expanding the radius."
          actionLabel="Clear Filters"
          onAction={() => {
            setQuery('');
            setSelectedCategory('');
            setPickupOnly(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {businesses.map((b) => (
            <Card key={b.id} className="hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between">
              <div>
                {/* Studio Cover & Verified Badge */}
                <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                  <img
                    src={b.coverImageUrl || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop'}
                    alt={b.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="gold" className="shadow-md">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-700" />
                      Verified
                    </Badge>
                  </div>
                  {b.distanceKm !== undefined && (
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md">
                      {b.distanceKm} km away
                    </div>
                  )}
                </div>

                <CardContent className="pt-4">
                  {/* Name and Rating */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-stone-900 line-clamp-1">{b.name}</h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {b.ratingAverage ? Number(b.ratingAverage).toFixed(1) : 'New'} ({b.totalReviewsCount || 0})
                    </div>
                  </div>

                  {/* Location Locality */}
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    {b.location?.locality || 'Hyderabad'}, {b.location?.city || 'Telangana'}
                  </p>

                  {/* Specialization Tags */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {(b.specializations || []).slice(0, 3).map((spec) => (
                      <span key={spec} className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* "Why this matches" Explainable Chips */}
                  {b.matchReasons && b.matchReasons.length > 0 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 space-y-1">
                      <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Why this matches
                      </p>
                      {b.matchReasons.slice(0, 3).map((reason, i) => (
                        <p key={i} className="text-[11px] text-amber-950 font-medium leading-tight">
                          {reason}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Price & Turnaround Summary */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500">
                      Starts at <strong className="text-stone-900 font-semibold">₹{b.startingPrice}</strong>
                    </span>
                    <span className="text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      Turnaround <strong className="text-stone-900 font-semibold">~{b.typicalTurnaroundDays} days</strong>
                    </span>
                  </div>
                </CardContent>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex gap-2">
                <Link to={`/tailors/${b.slug}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Studio
                  </Button>
                </Link>
                <Link to={`/app/requests/new?tailorId=${b.id}&name=${encodeURIComponent(b.name)}`} className="flex-1">
                  <Button size="sm" className="w-full text-xs">
                    Request Quote
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
