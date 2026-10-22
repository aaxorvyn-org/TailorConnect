import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  Compass,
  Star,
  Clock,
  Sparkles,
  Building2,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  Phone,
  Layers,
  Map as MapIcon,
  Grid,
  CheckCircle2,
  ExternalLink,
  LocateFixed,
  XCircle,
  ShoppingBag,
  Search,
} from 'lucide-react';
import { SearchBar } from '../../../components/common/SearchBar';
import { CreateOrderModal } from '../../../components/shared/CreateOrderModal';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '../../../components/common/FeedbackStates';
import { useToast } from '../../../hooks/useToast';
import { tailorDiscoveryService } from '../../../services/tailorDiscoveryService';
import type { NearbyTailor } from '../../../types/tailor';
import { useTranslation } from '../../../i18n';

// Default Sartorial London / Mayfair coordinates
const DEFAULT_COORDS = {
  latitude: 51.5074,
  longitude: -0.1278,
  label: 'London / Mayfair Atelier District',
};

export const CustomerNearbyTailorsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>(DEFAULT_COORDS);
  const [coordsLabel, setCoordsLabel] = useState<string>(DEFAULT_COORDS.label);
  const [radius, setRadius] = useState<number>(10);
  const [tailors, setTailors] = useState<NearbyTailor[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'timeout'
  >('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Sync search query if URL changes
  useEffect(() => {
    const urlQ = searchParams.get('search');
    if (urlQ !== null && urlQ !== searchQuery) {
      setSearchQuery(urlQ);
    }
  }, [searchParams]);

  // Selected tailor for details modal & Commission modal
  const [selectedTailor, setSelectedTailor] = useState<NearbyTailor | null>(null);
  const [commissionShop, setCommissionShop] = useState<NearbyTailor | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'grid'>('split');

  // Filter tailors by search query (shop name, owner, city, specialties, description)
  const filteredTailors = tailors.filter((tailor) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchName =
      (tailor.shop_name && tailor.shop_name.toLowerCase().includes(q)) ||
      (tailor.owner_name && tailor.owner_name.toLowerCase().includes(q));
    const matchCity =
      (tailor.city && tailor.city.toLowerCase().includes(q)) ||
      (tailor.state && tailor.state.toLowerCase().includes(q));
    const matchAddress = tailor.shop_address && tailor.shop_address.toLowerCase().includes(q);
    const matchSpecs =
      tailor.specialties &&
      (Array.isArray(tailor.specialties)
        ? tailor.specialties.some((s: string) => s.toLowerCase().includes(q))
        : String(tailor.specialties).toLowerCase().includes(q));
    return matchName || matchCity || matchAddress || matchSpecs;
  });

  // Fetch nearby tailors from backend
  const fetchNearbyTailors = useCallback(
    async (lat: number, lon: number, rad: number) => {
      // Validate coordinates
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        setBackendError('Invalid coordinates supplied. Latitude must be -90 to 90, longitude -180 to 180.');
        return;
      }

      try {
        setIsLoading(true);
        setBackendError(null);
        const results = await tailorDiscoveryService.getNearbyTailors({
          latitude: lat,
          longitude: lon,
          radius: rad,
        });
        setTailors(results);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to query nearby atelier shops';
        setBackendError(msg);
        showToast('error', 'Discovery Error', msg);
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  // Load tailors on coordinate or radius change
  useEffect(() => {
    fetchNearbyTailors(coords.latitude, coords.longitude, radius);
  }, [coords, radius, fetchNearbyTailors]);

  // Request browser geolocation permission & coordinates
  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      showToast('error', 'Geolocation Unavailable', 'Your browser does not support GPS geolocation.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc } = position.coords;
        setCoords({ latitude, longitude });
        setAccuracy(acc ? Math.round(acc) : null);
        setLocationStatus('granted');
        setCoordsLabel(`Live GPS (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)`);
        setIsLocating(false);
        showToast('success', 'Location Detected', `Found your position. Searching ateliers within ${radius} km.`);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationStatus('denied');
            showToast(
              'warning',
              'Location Access Denied',
              'Permission was denied in your browser. Using atelier district coordinates.'
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationStatus('unavailable');
            showToast('error', 'GPS Unavailable', 'Location information is currently unavailable.');
            break;
          case error.TIMEOUT:
            setLocationStatus('timeout');
            showToast('error', 'Location Timeout', 'The location request timed out. Please try again.');
            break;
          default:
            setLocationStatus('unavailable');
            showToast('error', 'Location Error', error.message || 'An unknown error occurred.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Preset location selector
  const handleSelectPreset = (preset: { latitude: number; longitude: number; label: string }) => {
    setCoords({ latitude: preset.latitude, longitude: preset.longitude });
    setCoordsLabel(preset.label);
    setLocationStatus('idle');
    setAccuracy(null);
    showToast('info', 'Location Updated', `Set search location to ${preset.label}.`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Geographic Discovery Engine • Phase 6</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('customer.nearby.title', 'Nearby Master Tailors & Ateliers')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {t('customer.nearby.subtitle', 'Locate verified bespoke master cutters, alteration artisans, and luxury couture houses sorted in real-time by geographic proximity to your position.')}
          </p>
        </div>

        {/* Find Near Me Call-to-Action */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleFindNearMe}
            isLoading={isLocating}
            leftIcon={<LocateFixed className="w-4 h-4 text-slate-950" />}
            className="shadow-lg shadow-emerald-500/20 font-bold"
          >
            {isLocating ? t('customer.nearby.locating', 'Detecting Location...') : t('customer.nearby.findNearMe', 'Find Near Me')}
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => fetchNearbyTailors(coords.latitude, coords.longitude, radius)}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />}
            title="Refresh nearby ateliers"
          >
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Geolocation Status Alert Bar */}
      {locationStatus === 'denied' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-200">{t('customer.nearby.permissionDenied', 'Browser Location Permission Denied')}</p>
            <p className="text-slate-300 leading-relaxed">
              We could not access your device location because permission was denied. You can enable location in your browser address bar icon, or test with our curated sartorial hubs below.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() =>
                  handleSelectPreset({
                    latitude: 51.5074,
                    longitude: -0.1278,
                    label: 'London Mayfair (Savile Row)',
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] transition-colors"
              >
                Set to London Mayfair (Default)
              </button>
            </div>
          </div>
        </div>
      )}

      {locationStatus === 'unavailable' && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-200">Device Location Unavailable</p>
            <p className="mt-0.5 leading-relaxed">
              Your device GPS or network positioning could not be retrieved. Using preset coordinates for atelier discovery.
            </p>
          </div>
        </div>
      )}

      {locationStatus === 'granted' && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-emerald-200">Live GPS Location Active:</span>
            <span className="font-mono text-slate-300">
              {coords.latitude.toFixed(4)}° N, {coords.longitude.toFixed(4)}° W
            </span>
            {accuracy && (
              <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                ±{accuracy}m accuracy
              </span>
            )}
          </div>
          <button
            onClick={handleFindNearMe}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2"
          >
            Re-detect GPS
          </button>
        </div>
      )}

      {/* Search Input for Nearby Tailors */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-lg">
            <SearchBar
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                if (val.trim()) {
                  setSearchParams({ search: val });
                } else {
                  setSearchParams({});
                }
              }}
              placeholder="Search nearby ateliers by shop name, craft (blouses, suits), master cutter, or city..."
            />
          </div>
          {searchQuery && (
            <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-400 shrink-0">
              <span>
                Found <strong className="text-white">{filteredTailors.length}</strong> {filteredTailors.length === 1 ? 'atelier' : 'ateliers'} for "{searchQuery}"
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Discovery Controls Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Active Center Location */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Search Origin Point
              </span>
              <span className="text-white font-bold block">{coordsLabel}</span>
            </div>
          </div>

          {/* Search Radius Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('customer.nearby.radius', 'Search Radius')}:
            </span>
            <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[2, 5, 10, 25, 50].map((dist) => (
                <button
                  key={dist}
                  onClick={() => setRadius(dist)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    radius === dist
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {dist} km
                </button>
              ))}
            </div>
          </div>

          {/* Preset Location Shortcuts & Layout Toggle */}
          <div className="flex items-center space-x-2">
            <select
              value={coordsLabel}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes('Mayfair')) {
                  handleSelectPreset({ latitude: 51.5074, longitude: -0.1278, label: 'London Mayfair' });
                } else if (val.includes('Kensington')) {
                  handleSelectPreset({ latitude: 51.5033, longitude: -0.1944, label: 'London Kensington' });
                } else if (val.includes('City')) {
                  handleSelectPreset({ latitude: 51.5135, longitude: -0.0805, label: 'City of London' });
                }
              }}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="London Mayfair">Hub: London Mayfair (Savile Row)</option>
              <option value="London Kensington">Hub: London Kensington</option>
              <option value="City of London">Hub: City Financial District</option>
            </select>

            {/* Layout Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'split' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-white'
                }`}
                title="Map & List Layout"
              >
                <MapIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-white'
                }`}
                title="Grid Cards Layout"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24">
          <LoadingSpinner label="Searching registered atelier shops and calculating geographic distances..." />
        </div>
      ) : backendError ? (
        <ErrorState
          title="Nearby Search Error"
          message={backendError}
          onRetry={() => fetchNearbyTailors(coords.latitude, coords.longitude, radius)}
        />
      ) : tailors.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8 text-emerald-400" />}
          title={t('customer.nearby.noTailorsFound', 'No tailor shops found in this area. Try extending your search radius.')}
          description={`We searched within a ${radius} km radius of your coordinates (${coords.latitude.toFixed(
            4
          )}°, ${coords.longitude.toFixed(4)}°), but found no registered bespoke shops.`}
          actionLabel="Expand Radius to 25 km"
          onAction={() => setRadius(25)}
        />
      ) : (
        <div className="space-y-6">
          {/* Interactive Geographic Radar Visual */}
          {viewMode === 'split' && (
            <Card className="p-0 overflow-hidden relative border border-slate-800">
              <div className="h-64 sm:h-80 w-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
                {/* Visual Grid Lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

                {/* Radar Concentric Distance Rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Outer Radius Ring */}
                  <div className="w-96 h-96 rounded-full border border-emerald-500/15" />
                  {/* Mid Radius Ring */}
                  <div className="w-64 h-64 rounded-full border border-emerald-500/25 animate-pulse" />
                  {/* Inner Radius Ring */}
                  <div className="w-32 h-32 rounded-full border border-emerald-500/35" />
                  {/* Crosshair lines */}
                  <div className="w-full h-px bg-slate-800/60 absolute" />
                  <div className="h-full w-px bg-slate-800/60 absolute" />
                </div>

                {/* Center User Location Pin */}
                <div className="absolute z-10 flex flex-col items-center">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-emerald-400 ring-4 ring-emerald-400/30 shadow-xl flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-400/20 absolute -inset-3 animate-ping pointer-events-none" />
                  </div>
                  <span className="text-[11px] font-bold text-white bg-slate-950/95 px-2.5 py-0.5 rounded-full border border-emerald-500/50 mt-1.5 shadow-md flex items-center space-x-1">
                    <Navigation className="w-2.5 h-2.5 text-emerald-400 transform -rotate-45" />
                    <span>Your Coordinates</span>
                  </span>
                </div>

                {/* Nearby Atelier Pins placed on the radar */}
                {filteredTailors.map((tailor, idx) => {
                  // Project radial coordinates based on distance and relative position
                  const angle = (idx * (360 / Math.max(1, filteredTailors.length)) + 45) * (Math.PI / 180);
                  const normalizedDist = Math.min(1, tailor.distance / Math.max(1, radius));
                  const radiusPixels = 50 + normalizedDist * 110;
                  const x = Math.cos(angle) * radiusPixels;
                  const y = Math.sin(angle) * radiusPixels;

                  return (
                    <div
                      key={tailor.shop_id}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      onClick={() => setSelectedTailor(tailor)}
                      className="absolute z-20 flex flex-col items-center cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg group-hover:scale-125 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-200">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-200 bg-slate-950/90 px-2 py-0.5 rounded-md border border-slate-800 mt-1 shadow-md whitespace-nowrap opacity-90 group-hover:opacity-100 group-hover:border-emerald-500/50 group-hover:text-white transition-all">
                        {tailor.shop_name} • <span className="text-emerald-400 font-mono">{tailor.distance} km</span>
                      </div>
                    </div>
                  );
                })}

                {/* Bottom Radar Meta Label */}
                <div className="absolute bottom-3 left-4 text-xs font-mono text-slate-400 bg-slate-950/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-800 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {filteredTailors.length} Atelier{filteredTailors.length === 1 ? '' : 's'} {searchQuery ? `matching "${searchQuery}"` : `registered within ${radius} km of your position`}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Section Heading */}
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Nearby Ateliers Sorted by Distance</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {filteredTailors.length} Available
              </span>
            </h3>
            {filteredTailors.length > 0 && (
              <span className="text-xs text-slate-400">
                Closest: <strong className="text-emerald-400 font-mono">{filteredTailors[0]?.distance} km</strong>
              </span>
            )}
          </div>

          {/* Tailor Shop Cards Grid or Empty Search State */}
          {filteredTailors.length === 0 ? (
            <Card className="p-10 text-center border-dashed border-slate-800">
              <Search className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">No ateliers match "{searchQuery}"</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No nearby ateliers found with this specialty or atelier name within {radius} km. Try expanding your search radius or clearing the search.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                }}
                className="mt-4"
              >
                Clear Search
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTailors.map((tailor) => (
              <Card
                key={tailor.shop_id}
                hoverEffect
                className="p-0 overflow-hidden flex flex-col h-full group border-slate-800 hover:border-emerald-500/50 transition-all"
              >
                {/* Storefront Image */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={
                      tailor.cover_image ||
                      tailor.profile_image ||
                      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={tailor.shop_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* PROMINENT DISTANCE DISPLAY BADGE */}
                  <div className="absolute top-3 left-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-950/90 text-emerald-400 border border-emerald-500/40 backdrop-blur-md shadow-lg">
                    <Navigation className="w-3 h-3 text-emerald-400 transform -rotate-45" />
                    <span className="font-mono">{tailor.distance} km away</span>
                  </div>

                  {/* Rating Badge */}
                  {tailor.rating && (
                    <div className="absolute top-3 right-3 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-slate-950 shadow-md">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{tailor.rating.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Avatar overlapping bottom */}
                  <div className="absolute -bottom-5 left-5 flex items-center space-x-3">
                    <img
                      src={
                        tailor.profile_image ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
                      }
                      alt={tailor.owner_name || tailor.shop_name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/60 shadow-lg bg-slate-900"
                    />
                  </div>
                </div>

                {/* Card Body */}
                <div className="pt-8 px-5 pb-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-400 uppercase tracking-wider">
                        {tailor.city} Atelier
                      </span>
                      {tailor.turnaround_days && (
                        <div className="flex items-center space-x-1 text-slate-400">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>{tailor.turnaround_days}d turnaround</span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white tracking-tight mt-1 group-hover:text-emerald-300 transition-colors">
                      {tailor.shop_name}
                    </h4>

                    {tailor.owner_name && (
                      <p className="text-xs text-slate-400 font-medium">Master Cutter: {tailor.owner_name}</p>
                    )}

                    {/* Street Address */}
                    <div className="flex items-start space-x-1.5 text-xs text-slate-300 mt-2.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{tailor.shop_address}</span>
                    </div>

                    {/* Specialties */}
                    {tailor.specialties && tailor.specialties.length > 0 && (
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
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      {tailor.starting_price ? (
                        <>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                            {t('customer.nearby.startingAt', 'Starting from')}
                          </span>
                          <span className="text-base font-extrabold text-white font-mono">
                            ${tailor.starting_price}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">Bespoke Couture</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedTailor(tailor)}
                      >
                        {t('common.viewDetails', 'Details')}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setCommissionShop(tailor)}
                        leftIcon={<ShoppingBag className="w-3.5 h-3.5 text-slate-950" />}
                      >
                        {t('customer.dashboard.orderNow', 'Commission')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )}

      {/* Atelier Detail Inspection Modal */}
      {selectedTailor && (
        <Modal
          isOpen={Boolean(selectedTailor)}
          onClose={() => setSelectedTailor(null)}
          size="lg"
          title={selectedTailor.shop_name}
          description={`${selectedTailor.distance} km from your coordinates • ${selectedTailor.city}`}
        >
          <div className="space-y-5">
            {/* Cover Header */}
            <div className="relative h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <img
                src={
                  selectedTailor.cover_image ||
                  selectedTailor.profile_image ||
                  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80'
                }
                alt={selectedTailor.shop_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                <span className="bg-slate-950/90 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/40 font-mono font-bold shadow-md">
                  📍 {selectedTailor.distance} km away
                </span>
                {selectedTailor.rating && (
                  <span className="bg-amber-500/90 text-slate-950 px-2.5 py-1 rounded-full font-bold shadow-md flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{selectedTailor.rating.toFixed(2)} rating</span>
                  </span>
                )}
              </div>
            </div>

            {/* Demographics & Public Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Physical Atelier Address
                </span>
                <span className="text-white font-medium block">{selectedTailor.shop_address}</span>
                <span className="text-slate-400 block">
                  {selectedTailor.city}, {selectedTailor.state || ''} {selectedTailor.pincode || ''}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  Coords: {selectedTailor.latitude.toFixed(4)}°, {selectedTailor.longitude.toFixed(4)}°
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Master Cutter &amp; Contact
                </span>
                <span className="text-white font-bold block">{selectedTailor.owner_name || 'Master Artisan'}</span>
                {selectedTailor.phone && (
                  <span className="text-emerald-400 font-mono block flex items-center space-x-1 mt-1">
                    <Phone className="w-3 h-3" />
                    <span>{selectedTailor.phone}</span>
                  </span>
                )}
                {selectedTailor.turnaround_days && (
                  <span className="text-slate-400 block mt-0.5">
                    Production lead time: ~{selectedTailor.turnaround_days} days
                  </span>
                )}
              </div>
            </div>

            {/* Specialties */}
            {selectedTailor.specialties && selectedTailor.specialties.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Signature Craftsmanship
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedTailor.specialties.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Phase Scope Notice */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-emerald-300 block flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Phase 9 Made-to-Measure Commissioning</span>
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Commission a bespoke suit, shirt, dress, or lehenga from {selectedTailor.shop_name}. Select your saved Phase 8 anatomical measurements, attach reference styling photos, and track atelier production milestones in real time.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTailor(null)}>
                Close Preview
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShoppingBag className="w-4 h-4 text-slate-950" />}
                onClick={() => {
                  const shop = selectedTailor;
                  setSelectedTailor(null);
                  setCommissionShop(shop);
                }}
              >
                Commission Bespoke Garment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Commission Flow Wizard Modal */}
      <CreateOrderModal
        isOpen={Boolean(commissionShop)}
        onClose={() => setCommissionShop(null)}
        initialShopId={commissionShop?.shop_id}
        onOrderPlaced={() => {
          setCommissionShop(null);
          navigate('/dashboard/customer/orders');
        }}
      />
    </div>
  );
};

