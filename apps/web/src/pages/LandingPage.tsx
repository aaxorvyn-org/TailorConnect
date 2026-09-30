import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Scissors,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Star,
  ChevronRight,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';

export function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/requests/new?prompt=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/explore');
    }
  };

  const quickPicks = [
    'Bridal Blouse with Embroidery',
    'Custom Silk Lehenga',
    'Two-Piece Bespoke Suit',
    'Anarkali Kurti Suit',
    'Gentlemen Sherwani',
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-20 pb-12 sm:pb-24 overflow-hidden border-b border-stone-200 bg-gradient-to-b from-stone-100/60 to-[#FAFAF9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI-Powered Custom Tailoring & Boutique Operating System</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.1]">
            Find the right tailor for <br className="hidden sm:block" />
            <span className="text-amber-600">what you want stitched.</span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Describe your garment in plain words, discover verified nearby specialists, get transparent itemized quotes, and track your stitching milestone-by-milestone.
          </p>

          {/* Natural Language Search Intake */}
          <div className="mt-8 sm:mt-10 max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-xl border border-stone-200">
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-stone-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Bridal blouse with heavy embroidery by next Friday..."
                  className="w-full pl-3 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 bg-transparent focus:outline-none"
                />
              </div>
              <Button type="submit" size="lg" className="sm:w-auto w-full">
                <Sparkles className="w-4 h-4 text-amber-400 mr-2" />
                Describe & Match
              </Button>
            </form>

            {/* Quick Prompt Tags */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-stone-500">
              <span className="font-medium text-stone-400">Popular:</span>
              {quickPicks.map((pick) => (
                <button
                  key={pick}
                  onClick={() => navigate(`/app/requests/new?prompt=${encodeURIComponent(pick)}`)}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                >
                  {pick}
                </button>
              ))}
            </div>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-12 pt-8 border-t border-stone-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="font-display text-2xl font-bold text-stone-900">100%</p>
              <p className="text-xs text-stone-500 font-medium">Verified Studios</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-stone-900">Amazon-Style</p>
              <p className="text-xs text-stone-500 font-medium">Milestone Tracking</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-stone-900">Itemized</p>
              <p className="text-xs text-stone-500 font-medium">No Hidden Surcharges</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-stone-900">4.9 ★</p>
              <p className="text-xs text-stone-500 font-medium">Average Studio Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (The Core Loop) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <Badge variant="gold" className="mb-2">Simple 4-Step Process</Badge>
          <h2 className="font-display text-3xl font-bold text-stone-900 tracking-tight">
            How TailorConnect Works
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            No more endless WhatsApp back-and-forth or guesswork about delivery dates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-stone-200">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-semibold text-stone-900 text-lg">Describe Your Garment</h3>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                Speak or type naturally. Our AI extracts garment type, embroidery, sleeves, and timeline urgency.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-stone-200">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-semibold text-stone-900 text-lg">Match Capable Tailors</h3>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                Discover nearby studios filtered by capability, turnaround capacity, and verified portfolio work.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-stone-200">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-semibold text-stone-900 text-lg">Itemized Quotes</h3>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                Receive clear breakdowns for labor, lining, and embroidery. Accept online or pay in person at the studio.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-stone-200">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-bold text-lg mb-4">
                4
              </div>
              <h3 className="font-semibold text-stone-900 text-lg">Milestone Tracking</h3>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                Watch your garment progress through Cutting, Stitching, Fitting, and Final Delivery on a live timeline.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Tailor Studios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <Badge variant="gold" className="mb-2">Verified Ateliers</Badge>
            <h2 className="font-display text-3xl font-bold text-stone-900 tracking-tight">
              Featured Studios in Hyderabad
            </h2>
            <p className="text-stone-600 text-sm mt-1">
              Hand-verified ateliers and master tailors known for exceptional fit and finish.
            </p>
          </div>
          <Link to="/explore">
            <Button variant="outline" size="sm">
              View All Studios
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Meera Boutique */}
          <Card className="hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop"
                  alt="Meera Boutique"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge variant="gold" className="absolute top-3 right-3 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-700" />
                  Verified Studio
                </Badge>
              </div>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-stone-900">Meera Boutique</h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    4.9 (128)
                  </div>
                </div>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  Banjara Hills, Hyderabad · 5.9 km away
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">Bridal Blouse</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">Zardosi Work</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">Lehengas</span>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Starting at <strong className="text-stone-900">₹1,200</strong></span>
                  <span className="text-stone-500">Turnaround <strong className="text-stone-900">~5 days</strong></span>
                </div>
              </CardContent>
            </div>
            <div className="p-4 pt-0">
              <Link to="/tailors/meera-boutique" className="w-full">
                <Button variant="primary" size="sm" className="w-full">
                  View Studio & Portfolio
                </Button>
              </Link>
            </div>
          </Card>

          {/* Ramesh Tailors */}
          <Card className="hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop"
                  alt="Ramesh Tailors"
                  className="w-full h-full object-cover"
                />
                <Badge variant="gold" className="absolute top-3 right-3 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-700" />
                  Verified Master
                </Badge>
              </div>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-stone-900">Ramesh Master Tailor</h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    4.8 (210)
                  </div>
                </div>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  Madhapur, Hyderabad · 0 km away
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">Quick Alterations</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">Daily Blouses</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">Salwar Suits</span>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Starting at <strong className="text-stone-900">₹450</strong></span>
                  <span className="text-stone-500">Turnaround <strong className="text-stone-900">~3 days</strong></span>
                </div>
              </CardContent>
            </div>
            <div className="p-4 pt-0">
              <Link to="/tailors/ramesh-tailors" className="w-full">
                <Button variant="primary" size="sm" className="w-full">
                  View Studio & Portfolio
                </Button>
              </Link>
            </div>
          </Card>

          {/* Royal Men's Bespoke */}
          <Card className="hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop"
                  alt="Royal Mens Bespoke"
                  className="w-full h-full object-cover"
                />
                <Badge variant="gold" className="absolute top-3 right-3 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-700" />
                  Verified Atelier
                </Badge>
              </div>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-stone-900">Royal Men's Bespoke</h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    4.9 (150)
                  </div>
                </div>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  Kondapur, Hyderabad · 3.5 km away
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">Wedding Sherwanis</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">Two-Piece Suits</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">Bandhgalas</span>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Starting at <strong className="text-stone-900">₹3,500</strong></span>
                  <span className="text-stone-500">Turnaround <strong className="text-stone-900">~10 days</strong></span>
                </div>
              </CardContent>
            </div>
            <div className="p-4 pt-0">
              <Link to="/tailors/royal-mens-bespoke" className="w-full">
                <Button variant="primary" size="sm" className="w-full">
                  View Studio & Portfolio
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Banner for Tailors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-xl">
            <Badge variant="gold" className="mb-3">For Tailors & Boutiques</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Grow your bespoke business digitally.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
              Receive structured stitching requests from nearby customers, send itemized quotes in seconds, and manage your cutting and stitching orders with digital timeline clarity.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register?role=BUSINESS">
                <Button variant="secondary" size="lg">
                  Join as a Tailor / Studio
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" size="lg" className="border-slate-700 text-white hover:bg-slate-800">
                  Explore Marketplace
                </Button>
              </Link>
            </div>
          </div>
          {/* Subtle background motif */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-10 pointer-events-none flex items-center justify-center">
            <Scissors className="w-96 h-96 -rotate-12 text-white" />
          </div>
        </div>
      </section>
    </div>
  );
}
