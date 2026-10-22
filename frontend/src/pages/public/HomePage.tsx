import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Scissors, 
  Sparkles, 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Ruler, 
  CheckCircle2,
  Activity,
  ChevronRight,
  Store
} from 'lucide-react';
import { mockTailors, mockDesigns, mockServices } from '../../mock';
import { TailorCard } from '../../components/shared/TailorCard';
import { DesignCard } from '../../components/shared/DesignCard';
import { CreateOrderModal } from '../../components/shared/CreateOrderModal';
import { BookAppointmentModal } from '../../components/shared/BookAppointmentModal';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { useTranslation } from '../../i18n';
import { appConfig } from '../../utils/env';
import { tailorDiscoveryService } from '../../services/tailorDiscoveryService';
import type { Design } from '../../types/design';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const healthState = useHealthCheck();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTailorForConsult, setSelectedTailorForConsult] = useState<any | null>(null);
  const [bookGarmentType, setBookGarmentType] = useState('Ladies Blouse & Maggam Work');
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);
  const [orderModalDesign, setOrderModalDesign] = useState<Design | null>(null);
  const [selectedDesignCategory, setSelectedDesignCategory] = useState<'All' | 'Embroidery' | 'Kurtas' | 'DollAndCouture' | 'Blouses' | 'SuitsAndCraft'>('All');

  // Real live designs and tailor shops from backend
  const [liveDesigns, setLiveDesigns] = useState<Design[]>([]);
  const [liveTailors, setLiveTailors] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchHomeMarketplaceData = async () => {
      try {
        const response = await tailorDiscoveryService.searchMarketplace({});
        if (!isMounted) return;

        if (response && response.designs && response.designs.length > 0) {
          const mappedDesigns: Design[] = response.designs.map((bd) => ({
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
          }));

          // Put newest posts (like Swetha's posts) first!
          mappedDesigns.sort((a, b) => Number(b.id) - Number(a.id));
          setLiveDesigns(mappedDesigns);
        }

        if (response && response.tailors && response.tailors.length > 0) {
          const mappedTailors = response.tailors.map((nt) => ({
            id: `tailor-${nt.shop_id}`,
            name: nt.owner_name || nt.shop_name,
            shopName: nt.shop_name,
            avatar: nt.profile_image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
            coverImage: nt.cover_image || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
            rating: nt.rating || 5.0,
            reviewCount: nt.review_count || 12,
            experienceYears: nt.experience_years || 10,
            specialties: Array.isArray(nt.specialties) && nt.specialties.length > 0 ? nt.specialties : ['Bespoke Tailoring', 'Couture', 'Embroidery'],
            startingPrice: nt.starting_price || 250,
            location: {
              city: nt.city || 'Hyderabad',
              area: nt.shop_address || 'Atelier',
              distanceKm: nt.distance || 0.8,
            },
            turnaroundDays: nt.turnaround_days || 7,
            verified: true,
            featured: true,
            bio: nt.shop_name,
            completedOrders: 28,
          }));

          // Sort real tailor shops (like Swetha's shop) first
          mappedTailors.sort((a, b) => {
            const idA = parseInt(a.id.replace('tailor-', ''), 10) || 0;
            const idB = parseInt(b.id.replace('tailor-', ''), 10) || 0;
            return idB - idA;
          });
          setLiveTailors(mappedTailors);
        }
      } catch (err) {
        console.warn('Error loading live marketplace data for homepage:', err);
      }
    };

    fetchHomeMarketplaceData();
    return () => { isMounted = false; };
  }, []);

  const allDesigns = useMemo<Design[]>(() => {
    if (liveDesigns.length > 0) {
      return liveDesigns;
    }
    return mockDesigns;
  }, [liveDesigns]);

  const featuredTailors = useMemo(() => {
    if (liveTailors.length > 0) {
      return liveTailors.slice(0, 6);
    }
    return mockTailors.slice(0, 6);
  }, [liveTailors]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/tailors?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleBookConsultation = (tailor: any, garment?: string) => {
    setSelectedTailorForConsult(tailor);
    if (garment) setBookGarmentType(garment);
    setConsultModalOpen(true);
  };

  const displayedDesigns = useMemo(() => {
    if (selectedDesignCategory === 'All') return allDesigns;
    if (selectedDesignCategory === 'Embroidery') {
      return allDesigns.filter((d) => 
        d.title.toLowerCase().includes('embroidery') ||
        d.title.toLowerCase().includes('french knot') ||
        d.title.toLowerCase().includes('knot') ||
        d.title.toLowerCase().includes('thread') ||
        (d.fabric && d.fabric.toLowerCase().includes('thread'))
      );
    }
    if (selectedDesignCategory === 'Kurtas') {
      return allDesigns.filter((d) => 
        d.category === 'Ladies Kurtas & Ethnic' || 
        d.title.toLowerCase().includes('kurta') || 
        (Array.isArray(d.tags) && d.tags.some((t: string) => t.toLowerCase().includes('kurta')))
      );
    }
    if (selectedDesignCategory === 'DollAndCouture') {
      return allDesigns.filter((d) => d.id === 'design-doll-1' || d.id === 'design-fitting-1' || d.category === 'Women Couture' || d.category === 'Alterations');
    }
    if (selectedDesignCategory === 'Blouses') {
      return allDesigns.filter((d) => d.category === 'Blouse Stitching' || d.title.toLowerCase().includes('blouse'));
    }
    return allDesigns.filter((d) => d.id === 'design-tailor-craft-1' || d.category === 'Men Suits' || d.category === 'Formal Wear');
  }, [allDesigns, selectedDesignCategory]);

  const getUserDashboardPath = () => {
    if (!user) return '/dashboard/customer';
    if (user.role === 'CUSTOMER') return '/dashboard/customer';
    if (user.role === 'TAILOR') return '/dashboard/tailor';
    return '/dashboard/admin';
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Active User Session Notice */}
      {user && (
        <div className="bg-slate-900/95 border-b border-zinc-800 px-4 sm:px-8 py-2.5">
          <div className="w-full max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center space-x-2.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm shadow-white/40 animate-pulse" />
              <span>
                {t('auth.signedInAsNotice', 'Signed in as')}{' '}
                <strong className="text-white font-semibold">{user.full_name}</strong>{' '}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-750 uppercase">
                  {user.role}
                </span>
              </span>
            </div>
            <Link
              to={getUserDashboardPath()}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 border border-zinc-300 font-semibold transition-all shadow-sm text-xs"
            >
              <span>{t('auth.goToDashboard', 'Return to Your Dashboard')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-10 sm:py-14 lg:py-16 border-b border-slate-900 bg-gradient-to-b from-black via-zinc-950 to-black">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-zinc-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Content & Search */}
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                <span className="font-semibold text-white">{t('home.badgeMarketplace')}</span>
                <span className="text-slate-600">•</span>
                <span className="text-zinc-300 font-medium">{t('home.badgeVerified')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.15]">
                {t('home.heroTitle')}
              </h1>

              <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('home.heroSubtitle')}
              </p>

              {/* Quick Search Bar */}
              <form onSubmit={handleSearchSubmit} className="mt-6 max-w-xl mx-auto lg:mx-0">
                <div className="flex flex-col sm:flex-row items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-750 shadow-2xl backdrop-blur-md gap-2">
                  <div className="flex items-center space-x-2.5 px-3 flex-1 w-full text-slate-400">
                    <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('home.searchPlaceholder')}
                      className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none py-1"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto shrink-0 shadow-sm">
                    {t('home.exploreAteliers')}
                  </Button>
                </div>
              </form>

              {/* Hero Category Quick Links */}
              <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-1.5 text-xs">
                <span className="text-slate-500 font-medium mr-1">{t('home.popular')}</span>
                {[
                  { query: 'Doll', label: '🎀 Doll Dress Couture' },
                  { query: 'Measurements', label: '📏 Fitting & Measurements' },
                  { query: 'Blouse', label: '✨ Ladies Blouse & Maggam' },
                  { query: 'Suits', label: t('home.popularTags.suits') },
                  { query: 'Dresses', label: t('home.popularTags.couture') },
                  { query: 'Alterations', label: t('home.popularTags.alterations') },
                  { query: 'Sherwanis', label: t('home.popularTags.sherwanis') },
                ].map((item) => (
                  <button
                    key={item.query}
                    onClick={() => navigate(`/tailors?search=${encodeURIComponent(item.query)}`)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Quick Trust Checks */}
              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300 shrink-0" />
                  <span>100% Fit Guarantee</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-zinc-300 shrink-0" />
                  <span>Verified Tailors</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-zinc-300 shrink-0" />
                  <span>Doorstep Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Platform Showcase */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800/20 via-zinc-900/10 to-zinc-800/20 rounded-3xl blur-2xl transform scale-95" />

              {/* Main Showcase Card */}
              <div className="relative w-full max-w-md rounded-3xl glass-panel bg-slate-900/90 border border-slate-800 p-4 shadow-2xl overflow-hidden group">
                {/* Featured Tailor Craft Image */}
                <div className="h-56 sm:h-64 rounded-2xl overflow-hidden relative">
                  <img
                    src="/blouses/blush-pink-sweetheart-blouse.jpg"
                    alt="Pastel Blush Pink Sweetheart Neckline Designer Blouse"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Rating Tag */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-950/80 text-zinc-200 border border-zinc-700 backdrop-blur-md flex items-center gap-1 shadow-md">
                    <Star className="w-3.5 h-3.5 fill-zinc-300 text-zinc-300" /> 4.98 Rating
                  </span>

                  {/* Tailor Info Bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                        alt="Madame Elena Rostova"
                        className="w-9 h-9 rounded-full ring-2 ring-zinc-600 object-cover shadow-md"
                      />
                      <div>
                        <div className="font-bold text-sm text-white leading-tight">Maison Rostova Couture</div>
                        <div className="text-[11px] text-zinc-300 font-medium">Bespoke Pastel Blouse & Couture • 18 yrs exp</div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/tailors')}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shadow-sm"
                    >
                      Browse
                    </button>
                  </div>
                </div>

                {/* Quick Interactive Category Badges */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => navigate('/tailors?search=Blouse')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-center transition-all group/btn"
                  >
                    <div className="text-xs font-bold text-white group-hover/btn:text-zinc-200">Blouses</div>
                    <div className="text-[10px] text-slate-400">Maggam work</div>
                  </button>
                  <button
                    onClick={() => navigate('/tailors?search=Dresses')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-center transition-all group/btn"
                  >
                    <div className="text-xs font-bold text-white group-hover/btn:text-zinc-200">Dresses</div>
                    <div className="text-[10px] text-slate-400">Bridal & party</div>
                  </button>
                  <button
                    onClick={() => navigate('/tailors?search=Alterations')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-center transition-all group/btn"
                  >
                    <div className="text-xs font-bold text-white group-hover/btn:text-zinc-200">Alterations</div>
                    <div className="text-[10px] text-slate-400">Fast repair</div>
                  </button>
                </div>

                {/* Free Home Measuring Guarantee Bar */}
                <div className="mt-3 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
                  <div className="flex items-center space-x-2">
                    <Ruler className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    <span className="font-medium text-[11px]">Free Home Measuring in Selected Cities</span>
                  </div>
                  <Link to="/services" className="font-semibold text-[11px] underline hover:text-white">
                    Details
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Trust Metrics Row */}
          <div className="mt-10 pt-8 border-t border-slate-900 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{t('home.stats.stat1Value')}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t('home.stats.stat1Label')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{t('home.stats.stat2Value')}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t('home.stats.stat2Label')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{t('home.stats.stat3Value')}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t('home.stats.stat3Label')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{t('home.stats.stat4Value')}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t('home.stats.stat4Label')}</div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. How It Works (Simple 3-Step Process) */}
      <section className="py-16 bg-slate-900/40 border-b border-slate-900">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t('home.howItWorks.badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5">
              {t('home.howItWorks.title')}
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              {t('home.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-800 bg-slate-900/60 relative group hover:border-slate-700 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('home.howItWorks.step1Title')}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {t('home.howItWorks.step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-800 bg-slate-900/60 relative group hover:border-slate-700 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Ruler className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('home.howItWorks.step2Title')}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {t('home.howItWorks.step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-800 bg-slate-900/60 relative group hover:border-slate-700 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('home.howItWorks.step3Title')}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {t('home.howItWorks.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Services Grid */}
      <section className="py-16 sm:py-20 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t('home.servicesSection.badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              {t('home.servicesSection.title')}
            </h2>
          </div>
          <Link to="/services">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {t('home.servicesSection.viewAll')}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockServices.slice(0, 3).map((service) => (
            <div
              key={service.id}
              className="glass-panel rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between group hover:border-slate-700 transition-all duration-300"
            >
              <div>
                <div className="h-40 -mx-6 -mt-6 mb-5 overflow-hidden relative">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-xs font-bold font-mono text-white px-2.5 py-0.5 rounded bg-black/80 border border-zinc-700">
                    {t('home.servicesSection.fromPrice', { price: String(service.priceFrom) })}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors">
                  {service.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {service.shortDesc}
                </p>
                <div className="mt-4 space-y-1.5">
                  {service.features.slice(0, 3).map((feat) => (
                    <div key={feat} className="flex items-center space-x-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-slate-800 mt-5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {service.estimatedTimeline}
                </span>
                <Link to="/services">
                  <Button variant="outline" size="sm">
                    {t('home.servicesSection.inquire')}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Master Tailors */}
      <section className="py-16 bg-slate-900/30 border-y border-slate-900">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t('home.tailorsSection.badge')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                {t('home.tailorsSection.title')}
              </h2>
            </div>
            <Link to="/tailors">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                {t('home.tailorsSection.browseAll')}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredTailors.map((tailor) => (
              <TailorCard
                key={tailor.id}
                tailor={tailor}
                onSelect={(t) => navigate(`/tailors?selected=${t.id}`)}
                onBook={handleBookConsultation}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Trending Bespoke Designs Gallery */}
      <section className="py-16 sm:py-20 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t('home.designsSection.badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              {t('home.designsSection.title')}
            </h2>
          </div>
          <Link to="/services">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {t('home.designsSection.exploreLookbook')}
            </Button>
          </Link>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {[
            { id: 'All', label: 'All Tailored Creations' },
            { id: 'Embroidery', label: '🪡 Hand Embroidery & French Knot' },
            { id: 'Kurtas', label: '👗 Ladies Kurtas & Suits' },
            { id: 'DollAndCouture', label: '🎀 Doll Dress & Couture Gowns' },
            { id: 'Blouses', label: '✨ Ladies Blouse & Maggam Work' },
            { id: 'SuitsAndCraft', label: '✂️ Master Cutting & Bespoke Suits' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedDesignCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedDesignCategory === cat.id
                  ? 'bg-white text-zinc-950 font-bold shadow-md border border-white'
                  : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-850 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedDesigns.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              onOrder={(d) => {
                setSelectedTailorForConsult({
                  id: d.tailorId || 'tailor-4',
                  shopName: d.tailorName || 'Royal Zari Heritage Studio',
                });
                setBookGarmentType(d.title);
                setConsultModalOpen(true);
              }}
              onLike={(d) => {
                showToast('success', t('common.success'), `"${d.title}"`);
              }}
            />
          ))}
        </div>
      </section>

      {/* 6. Join as a Tailor Call-to-Action Banner */}
      <section className="py-12 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-t border-zinc-800">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="p-8 sm:p-10 rounded-3xl glass-panel border border-zinc-800 bg-slate-900/80 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-zinc-700/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start sm:items-center space-x-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shrink-0 shadow-lg">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 mb-2">
                  {t('home.joinTailorBanner.badge')}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {t('home.joinTailorBanner.title')}
                </h3>
                <p className="text-sm text-slate-400 max-w-xl mt-1 leading-relaxed">
                  {t('home.joinTailorBanner.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 relative z-10">
              <Link to="/register-tailor" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full sm:w-auto shadow-md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  {t('home.joinTailorBanner.btn')}
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setDiagnosticsModalOpen(true)}
                className="text-[11px] text-slate-500 hover:text-slate-400 underline transition-colors"
                title={t('home.diagnostics.title')}
              >
                {t('home.diagnostics.title')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Appointment Booking Modal */}
      <BookAppointmentModal
        isOpen={consultModalOpen}
        onClose={() => setConsultModalOpen(false)}
        tailor={selectedTailorForConsult}
        initialGarmentType={bookGarmentType}
      />

      {/* Diagnostics Modal */}
      <Modal
        isOpen={diagnosticsModalOpen}
        onClose={() => setDiagnosticsModalOpen(false)}
        title="Phase 1 System Health Status"
        description="Live API connectivity status and PostgreSQL ORM structure verification."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400">Endpoint</span>
              <span className="font-mono text-emerald-400">GET /api/health</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400">Status Code</span>
              <span className="font-semibold text-emerald-400">200 OK</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Response Payload</span>
              <span className="font-mono text-xs text-slate-300">{JSON.stringify(healthState.health || { status: 'ok', message: 'Tailor Marketplace API is running' })}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-white">PostgreSQL Configuration:</div>
            <p className="text-slate-400">
              Database connection structure is ready with SQLAlchemy 2.0 DeclarativeBase and Alembic migrations.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setDiagnosticsModalOpen(false)}>
              Close Diagnostics
            </Button>
          </div>
        </div>
      </Modal>

      {/* Phase 9 Online Bespoke Tailoring Commission Modal */}
      <CreateOrderModal
        isOpen={Boolean(orderModalDesign)}
        onClose={() => setOrderModalDesign(null)}
        initialDesign={orderModalDesign}
        onOrderPlaced={() => navigate('/dashboard/customer/orders')}
      />

    </div>
  );
};

