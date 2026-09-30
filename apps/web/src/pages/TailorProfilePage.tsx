import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@tailorconnect/api-client';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  Truck,
  Scissors,
  Check,
  Calendar,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export function TailorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [studio, setStudio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStudio() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const res = await api.discovery.getBySlug(slug);
        if (res.success && res.data) {
          setStudio(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStudio();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-stone-500">
        Loading tailor studio profile...
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-stone-900">Studio Not Found</h2>
        <p className="text-sm text-stone-500 mt-2">The requested tailoring studio could not be found.</p>
        <Link to="/explore" className="mt-4 inline-block">
          <Button size="sm">Browse All Tailors</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
        {/* Cover Photo */}
        <div className="relative h-56 sm:h-72 w-full bg-slate-900">
          <img
            src={studio.coverImageUrl || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&auto=format&fit=crop'}
            alt={studio.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <Badge variant="gold" className="absolute top-4 left-4 shadow-lg">
            <ShieldCheck className="w-4 h-4 mr-1 text-amber-700" />
            Verified Atelier
          </Badge>
        </div>

        {/* Studio Identity Strip */}
        <div className="p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
                  {studio.name}
                </h1>
                <Badge variant="secondary" className="capitalize text-xs">
                  {studio.businessType?.replace('_', ' ').toLowerCase()}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-stone-600">
                <span className="flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  <Star className="w-4 h-4 fill-amber-500" />
                  {Number(studio.ratingAverage).toFixed(1)} ({studio.totalReviewsCount} reviews)
                </span>
                <span className="flex items-center gap-1 text-stone-500">
                  <Scissors className="w-4 h-4" />
                  {studio.completedOrdersCount}+ garments crafted
                </span>
                <span className="flex items-center gap-1 text-stone-500">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  {studio.location?.addressLine1}, {studio.location?.locality}, {studio.location?.city}
                </span>
              </div>
            </div>

            {/* Direct CTA Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(`/app/appointments?businessId=${studio.id}&name=${encodeURIComponent(studio.name)}`)}
              >
                <Calendar className="w-4 h-4 mr-1.5" />
                Book Fitting / Visit
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/app/requests/new?tailorId=${studio.id}&name=${encodeURIComponent(studio.name)}`)}
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" />
                Request Quote
              </Button>
            </div>
          </div>

          {/* Service Capabilities Badges */}
          <div className="mt-6 pt-6 border-t border-stone-100 flex flex-wrap gap-4 text-xs font-medium text-stone-600">
            {studio.offersHomePickup && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Truck className="w-3.5 h-3.5" /> Free Home Pickup & Delivery
              </span>
            )}
            {studio.offersHomeMeasurement && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Home Measurement Available
              </span>
            )}
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800">
              <Clock className="w-3.5 h-3.5 text-stone-500" /> Turnaround: ~{studio.typicalTurnaroundDays} days
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800">
              <MapPin className="w-3.5 h-3.5 text-stone-500" /> Service Radius: {studio.serviceRadiusKm} km
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): About & Portfolio Gallery */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>About the Studio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-600 leading-relaxed">
                {studio.description || 'Specialized bespoke boutique delivering made-to-measure tailoring and couture stitching.'}
              </p>

              <div className="mt-4">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(studio.specializations || []).map((spec: any) => (
                    <span key={spec.id || spec.tag} className="px-3 py-1 rounded-lg bg-stone-100 text-stone-800 text-xs font-medium">
                      {spec.tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Showcase */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Crafted Work</CardTitle>
              <span className="text-xs text-stone-500">
                {studio.portfolioItems?.length || 0} photos
              </span>
            </CardHeader>
            <CardContent>
              {studio.portfolioItems && studio.portfolioItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {studio.portfolioItems.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPhoto(item.imageUrl)}
                      className="group relative h-40 rounded-xl overflow-hidden bg-stone-100 cursor-pointer shadow-sm border border-stone-200"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                        <p className="text-xs font-semibold line-clamp-1">{item.title}</p>
                        <span className="text-[10px] text-amber-300">{item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic">No portfolio items uploaded yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Customer Reviews Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Verified Customer Reviews</CardTitle>
                <p className="text-xs text-stone-500 mt-0.5">Reviews submitted after completed custom orders</p>
              </div>
              <div className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-sm">
                <Star className="w-4 h-4 fill-amber-500" />
                {Number(studio.ratingAverage).toFixed(1)} / 5.0
              </div>
            </CardHeader>
            <CardContent className="space-y-4 divide-y divide-stone-100">
              {studio.reviews && studio.reviews.length > 0 ? (
                studio.reviews.map((rev: any) => (
                  <div key={rev.id} className="pt-3 first:pt-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-stone-900">{rev.customerName}</span>
                      <span className="text-xs text-stone-400">{formatDate(rev.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-stone-500">· {rev.serviceType}</span>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-stone-600 mt-2 leading-relaxed italic">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 italic">No reviews yet for this studio.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Services Catalog & Working Hours */}
        <div className="space-y-6">
          {/* Services Price Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Services & Starting Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {studio.services && studio.services.length > 0 ? (
                studio.services.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                    <div>
                      <p className="font-semibold text-stone-900">{item.service?.name}</p>
                      <p className="text-stone-500 text-[11px] mt-0.5">Est. {item.estimatedDays} days</p>
                    </div>
                    <span className="font-bold text-stone-900">
                      from {formatCurrency(item.basePrice)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 italic">Full service catalog available on request.</p>
              )}
            </CardContent>
          </Card>

          {/* Working Hours Card */}
          <Card>
            <CardHeader>
              <CardTitle>Studio Working Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {studio.workingHours ? (
                Object.entries(studio.workingHours).map(([day, hours]: any) => (
                  <div key={day} className="flex items-center justify-between text-stone-600">
                    <span className="capitalize font-medium w-16">{day}</span>
                    <span className="text-stone-900">{hours.open} – {hours.close}</span>
                  </div>
                ))
              ) : (
                <p className="text-stone-500">Mon – Sat: 10:00 AM – 8:00 PM</p>
              )}
            </CardContent>
          </Card>

          {/* Studio Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Location & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-stone-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <p>{studio.location?.addressLine1}, {studio.location?.locality}, {studio.location?.city} - {studio.location?.postalCode}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                <span>+91 {studio.phone}</span>
              </div>
              {studio.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{studio.email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Photo Enlarge Modal */}
      <Modal isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} maxWidth="lg">
        {selectedPhoto && (
          <div className="overflow-hidden rounded-xl">
            <img src={selectedPhoto} alt="Portfolio preview" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
        )}
      </Modal>
    </div>
  );
}
