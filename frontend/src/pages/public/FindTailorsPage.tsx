import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Star, 
  Sparkles, 
  Scissors, 
  Clock, 
  CheckCircle2, 
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  X
} from 'lucide-react';
import { mockTailors } from '../../mock/tailors';
import { mockDesigns } from '../../mock/designs';
import type { Tailor } from '../../types/tailor';
import type { Design } from '../../types/design';
import { TailorCard } from '../../components/shared/TailorCard';
import { DesignCard } from '../../components/shared/DesignCard';
import { SearchBar } from '../../components/common/SearchBar';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState, LoadingSpinner } from '../../components/common/FeedbackStates';
import { BookAppointmentModal } from '../../components/shared/BookAppointmentModal';
import { CreateOrderModal } from '../../components/shared/CreateOrderModal';
import type { NearbyTailor } from '../../types/tailor';
import { tailorDiscoveryService, type BackendDesignResponse } from '../../services/tailorDiscoveryService';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from '../../i18n';

export const FindTailorsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialSelectedId = searchParams.get('selected');
  const { showToast } = useToast();
  const { t } = useTranslation();

  // State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'price'>('rating');
  const [activeTab, setActiveTab] = useState<'all' | 'tailors' | 'designs'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search Results State
  const [tailorsList, setTailorsList] = useState<Tailor[]>(mockTailors);
  const [designsList, setDesignsList] = useState<Design[]>(mockDesigns);

  // Modals State
  const [activeTailorModal, setActiveTailorModal] = useState<Tailor | null>(() => {
    if (initialSelectedId) {
      return mockTailors.find((t) => t.id === initialSelectedId) || null;
    }
    return null;
  });
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [selectedDesignForOrder, setSelectedDesignForOrder] = useState<Design | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState<boolean>(false);

  // Quick suggestion chips
  const popularSearches = [
    'Ladies Kurta',
    'Bridal Blouses',
    'Chikankari Kurti',
    'Anarkali Sets',
    'Bespoke Suits',
    'Tuxedos',
    'Sherwanis',
    'Master Alterations',
  ];

  const categories = [
    { key: 'All', label: t('categories.all', 'All Specialties') },
    { key: 'Ladies Kurtas & Ethnic', label: 'Ladies Kurtas & Ethnic' },
    { key: 'Bridal & Blouses', label: 'Bridal & Blouses' },
    { key: 'Bespoke Suits', label: t('categories.suits', 'Bespoke Suits') },
    { key: 'Tuxedos', label: t('categories.tuxedos', 'Tuxedos') },
    { key: 'Bridal Gowns', label: t('categories.bridal', 'Bridal Gowns') },
    { key: 'Sherwanis', label: t('categories.sherwanis', 'Sherwanis & Kurtas') },
    { key: 'Master Alterations', label: t('categories.alterations', 'Master Alterations') },
  ];

  const cities = ['All', 'Hyderabad', 'London', 'New York', 'Milan', 'Paris', 'Tokyo', 'New Delhi'];

  // Map Backend/NearbyTailor to UI Tailor model
  const mapNearbyTailor = (nt: NearbyTailor): Tailor => ({
    id: `tailor-${nt.shop_id}`,
    name: nt.owner_name || nt.shop_name,
    shopName: nt.shop_name,
    avatar: nt.profile_image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    coverImage: nt.cover_image || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
    rating: nt.rating || 4.9,
    reviewCount: nt.review_count || 12,
    experienceYears: 18,
    specialties: Array.isArray(nt.specialties) ? nt.specialties : [],
    startingPrice: nt.starting_price || 150,
    location: {
      city: nt.city || 'London',
      area: nt.shop_address || 'Mayfair',
      distanceKm: nt.distance || 1.2,
    },
    turnaroundDays: nt.turnaround_days || 14,
    verified: true,
    featured: (nt.rating || 0) >= 4.9,
    bio: nt.shop_name,
    completedOrders: (nt.review_count || 10) * 4,
  });

  // Map BackendDesign to UI Design model
  const mapBackendDesign = (bd: BackendDesignResponse): Design => ({
    id: bd.id,
    shop_id: bd.shop_id,
    shop_name: bd.shop_name || 'Bespoke Atelier',
    title: bd.title,
    category: bd.category_name || 'Traditional',
    tailorName: bd.shop_name || 'Bespoke Atelier',
    tailorId: `tailor-${bd.shop_id}`,
    image: bd.image_url || '/designs/ladies-chikankari-kurta.jpg',
    image_url: bd.image_url || '/designs/ladies-chikankari-kurta.jpg',
    priceEstimate: bd.price_from,
    price_from: bd.price_from,
    price_to: bd.price_to || bd.price_from * 1.3,
    fabric: bd.fabric || 'Pure Silk',
    fabricOptions: bd.fabric ? [bd.fabric] : ['Pure Silk', 'Chanderi', 'Cotton'],
    tags: bd.tags ? bd.tags.split(',').map((t) => t.trim()) : [],
    description: bd.description || '',
    likes: 120,
    customization_available: bd.customization_available,
    is_active: bd.is_active,
  });

  // Synchronize URL search params when changed externally
  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
    const urlCat = searchParams.get('category');
    if (urlCat !== null && urlCat !== selectedCategory) {
      setSelectedCategory(urlCat);
    }
  }, [searchParams]);

  // Execute fullstack search whenever query, category, city, or sortBy changes
  useEffect(() => {
    let isCancelled = false;
    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        const response = await tailorDiscoveryService.searchMarketplace({
          q: searchQuery,
          category: selectedCategory,
          city: selectedCity,
          sort_by: sortBy,
        });

          const mappedTailors = response.tailors.map(mapNearbyTailor);
          const mappedDesigns = response.designs.map(mapBackendDesign);

          // Show newest designs (including Swetha's posts) first!
          mappedDesigns.sort((a, b) => Number(b.id) - Number(a.id));

          // Put real registered shops first
          mappedTailors.sort((a, b) => {
            const idA = parseInt(a.id.replace('tailor-', ''), 10) || 0;
            const idB = parseInt(b.id.replace('tailor-', ''), 10) || 0;
            return idB - idA;
          });

          // If city filter is applied, also respect it
          const finalTailors = selectedCity === 'All'
            ? mappedTailors
            : mappedTailors.filter((t) => t.location.city.toLowerCase().includes(selectedCity.toLowerCase()));

          setTailorsList(finalTailors);
          setDesignsList(mappedDesigns);
        }
      } catch (err) {
        console.error('Failed to execute marketplace search:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchSearchResults();

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, selectedCategory, selectedCity, sortBy]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const newParams: Record<string, string> = {};
    if (val) newParams.search = val;
    if (selectedCategory !== 'All') newParams.category = selectedCategory;
    setSearchParams(newParams);
  };

  const handleCategorySelect = (catKey: string) => {
    setSelectedCategory(catKey);
    const newParams: Record<string, string> = {};
    if (searchQuery) newParams.search = searchQuery;
    if (catKey !== 'All') newParams.category = catKey;
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCity('All');
    setSearchParams({});
  };

  const totalResults = tailorsList.length + designsList.length;

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {t('tailorDiscovery.badge', 'TAILOR & DESIGN DIRECTORY')}
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            {t('tailorDiscovery.title', 'Find Tailors & Bespoke Garment Designs')}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            {t('tailorDiscovery.subtitle', 'Search verified master tailors, custom bespoke ateliers, and made-to-measure designs (such as Ladies Kurtas, Blouses, Suits, and Couture).')}
          </p>
        </div>

        <div className="text-xs font-medium text-slate-400">
          Showing <strong className="text-emerald-400 font-mono">{totalResults}</strong> matching results ({tailorsList.length} Ateliers • {designsList.length} Designs)
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by garment design (e.g., 'Ladies Kurta', 'Blouse', 'Suit') or tailor name..."
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            {/* City Selector */}
            <div className="w-full sm:w-44">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city === 'All' ? 'All Cities' : city}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="w-full sm:w-44">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="rating">{t('tailorDiscovery.sortRating', 'Highest Rated')}</option>
                <option value="experience">{t('tailorDiscovery.sortExperience', 'Most Experienced')}</option>
                <option value="price">{t('tailorDiscovery.sortPrice', 'Starting Price (Low to High)')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleSearchChange(term)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                searchQuery.toLowerCase() === term.toLowerCase()
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900/90 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {term}
            </button>
          ))}
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 ml-2"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Specialty Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 text-xs border-t border-slate-850">
          <span className="text-slate-500 text-[11px] font-medium mr-1 shrink-0">
            Clothing Specialty:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategorySelect(cat.key)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Query Feedback Banner */}
      {searchQuery && (
        <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm text-slate-200">
              Showing search results for <strong className="text-emerald-300 font-semibold">"{searchQuery}"</strong> across tailor shops and bespoke designs.
            </span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 shrink-0"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Discovery Tab Navigation */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Results ({totalResults})</span>
        </button>

        <button
          onClick={() => setActiveTab('designs')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'designs'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bespoke Designs & Garments ({designsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tailors')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tailors'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Tailor Ateliers ({tailorsList.length})</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner label="Searching ateliers and custom bespoke designs..." />
        </div>
      ) : totalResults === 0 ? (
        <EmptyState
          title={`No results matching "${searchQuery}"`}
          description="We couldn't find any tailor shops or bespoke designs matching your query. Try searching for 'Ladies Kurta', 'Blouse', 'Suit', or clearing your filters."
          actionLabel="Reset All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="space-y-12">
          {/* 1. BESPOKE DESIGNS SECTION */}
          {(activeTab === 'all' || activeTab === 'designs') && designsList.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Bespoke Garments & Custom Designs
                    </h2>
                    <p className="text-xs text-slate-400">
                      Made-to-measure tailored garments matching your search
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  {designsList.length} Available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {designsList.map((design) => (
                  <DesignCard
                    key={design.id}
                    design={design}
                    onOrder={(d) => {
                      setSelectedDesignForOrder(d);
                      setIsCreateOrderOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. TAILOR ATELIERS SECTION */}
          {(activeTab === 'all' || activeTab === 'tailors') && tailorsList.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Verified Master Tailors & Atelier Studios
                    </h2>
                    <p className="text-xs text-slate-400">
                      Master craftsmen and ateliers who specialize in these bespoke garments
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  {tailorsList.length} Ateliers
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {tailorsList.map((tailor) => (
                  <TailorCard
                    key={tailor.id}
                    tailor={tailor}
                    onSelect={(t) => setActiveTailorModal(t)}
                    onBook={(t) => {
                      setActiveTailorModal(t);
                      setConsultModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tailor Detail Profile Modal */}
      {activeTailorModal && (
        <Modal
          isOpen={Boolean(activeTailorModal && !consultModalOpen)}
          onClose={() => setActiveTailorModal(null)}
          size="lg"
        >
          <div className="space-y-6">
            <div className="relative h-48 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 overflow-hidden">
              <img
                src={activeTailorModal.coverImage}
                alt={activeTailorModal.shopName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-4 left-6 flex items-center space-x-3">
                <img
                  src={activeTailorModal.avatar}
                  alt={activeTailorModal.name}
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-emerald-500 shadow-xl"
                />
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {activeTailorModal.shopName}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Master Artisan: {activeTailorModal.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">{t('tailorDiscovery.rating', 'Rating')}</span>
                <span className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {activeTailorModal.rating}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">{t('tailorDiscovery.experience', 'Experience')}</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {activeTailorModal.experienceYears}+ years
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">{t('tailorDiscovery.turnaround', 'Turnaround')}</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {activeTailorModal.turnaroundDays} days
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">{t('tailorDiscovery.starting', 'Starting')}</span>
                <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                  ${activeTailorModal.startingPrice}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Craftsmanship Specialties
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeTailorModal.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Atelier Narrative
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeTailorModal.bio}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                {activeTailorModal.location.area}, {activeTailorModal.location.city}
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setConsultModalOpen(true)}
                leftIcon={<Calendar className="w-4 h-4 text-slate-950" />}
              >
                Book Appointment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Appointment Consultation Modal */}
      {activeTailorModal && (
        <BookAppointmentModal
          isOpen={consultModalOpen}
          onClose={() => setConsultModalOpen(false)}
          tailor={activeTailorModal}
        />
      )}

      {/* Bespoke Garment Commission Flow Wizard Modal */}
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        initialDesign={selectedDesignForOrder}
        onOrderPlaced={() => {
          setIsCreateOrderOpen(false);
          showToast('success', 'Order Placed', 'Your custom garment commission has been submitted!');
        }}
      />
    </div>
  );
};
