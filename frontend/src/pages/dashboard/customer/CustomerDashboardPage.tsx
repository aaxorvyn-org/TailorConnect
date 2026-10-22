import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  MapPin, 
  Ruler, 
  Star, 
  ArrowRight, 
  Sparkles,
  Calendar,
  Clock,
  Scissors,
  CheckCircle2,
  XCircle,
  Home,
  Building2,
  Video,
  Plus
} from 'lucide-react';
import { mockCustomerStats, mockOrders, mockTailors, mockCustomerProfile } from '../../../mock';
import type { Tailor } from '../../../types/tailor';
import type { Order } from '../../../types/order';
import { StatCard } from '../../../components/common/Card';
import { OrderCard } from '../../../components/shared/OrderCard';
import { TailorCard } from '../../../components/shared/TailorCard';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { BookAppointmentModal } from '../../../components/shared/BookAppointmentModal';
import { OrderDetailsModal } from '../../../components/shared/OrderDetailsModal';
import { appointmentService, type AppointmentBooking } from '../../../services/appointmentService';
import { useTranslation } from '../../../i18n';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../../../components/common/SearchBar';
import { Search, X } from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Search States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [tailorSearchQuery, setTailorSearchQuery] = useState('');

  const recommendedTailors = mockTailors.slice(0, 2);

  // Filter recent orders dynamically based on search query
  const filteredActiveOrders = mockOrders.filter((order) => {
    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.toLowerCase().trim();
    const matchId =
      String(order.id).toLowerCase().includes(q) ||
      (order.order_number && order.order_number.toLowerCase().includes(q)) ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(q));
    const matchItem =
      (order.itemTitle && order.itemTitle.toLowerCase().includes(q)) ||
      (order.category && order.category.toLowerCase().includes(q)) ||
      (order.items &&
        order.items.some(
          (it) =>
            (it.item_title && it.item_title.toLowerCase().includes(q)) ||
            (it.customization_notes && it.customization_notes.toLowerCase().includes(q))
        ));
    const matchTailor =
      (order.tailorName && order.tailorName.toLowerCase().includes(q)) ||
      (order.tailor_shop_name && order.tailor_shop_name.toLowerCase().includes(q));
    const matchStatus = order.status && String(order.status).toLowerCase().includes(q);
    const matchNotes =
      (order.notes && order.notes.toLowerCase().includes(q)) ||
      (order.customer_notes && order.customer_notes.toLowerCase().includes(q));
    return Boolean(matchId || matchItem || matchTailor || matchStatus || matchNotes);
  });

  // Modal & Selection States
  const [selectedTailorForBooking, setSelectedTailorForBooking] = useState<Tailor | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTailorProfile, setSelectedTailorProfile] = useState<Tailor | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);

  // Appointments state
  const [appointments, setAppointments] = useState<AppointmentBooking[]>(() =>
    appointmentService.getAppointments()
  );

  const handleBookingConfirmed = (newBooking: AppointmentBooking) => {
    setAppointments([newBooking, ...appointments.filter((a) => a.id !== newBooking.id)]);
  };

  const handleCancelAppointment = (id: string) => {
    const updated = appointmentService.cancelAppointment(id);
    setAppointments(updated);
    showToast('info', 'Appointment Cancelled', 'Your scheduled fitting has been cancelled.');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/20 relative overflow-hidden">
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer Bespoke Wardrobe</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('customer.dashboard.welcome', { name: user?.full_name || mockCustomerProfile.name })}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {t('customer.dashboard.subtitle')}
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <Link to="/dashboard/customer/orders">
              <Button variant="primary" size="sm">
                {t('customer.dashboard.viewAllOrders')}
              </Button>
            </Link>
            <Link to="/dashboard/customer/measurements">
              <Button variant="outline" size="sm" leftIcon={<Ruler className="w-3.5 h-3.5" />}>
                {t('customer.dashboard.manageMeasurements')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Atelier Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Find Master Tailors & Bespoke Garments</div>
            <div className="text-[11px] text-slate-400">Search master cutters, saree blouses, maggam embroidery, suits, or city</div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (tailorSearchQuery.trim()) {
              navigate(`/tailors?search=${encodeURIComponent(tailorSearchQuery.trim())}`);
            }
          }}
          className="flex items-center gap-2 flex-1 md:max-w-md"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={tailorSearchQuery}
              onChange={(e) => setTailorSearchQuery(e.target.value)}
              placeholder="Search tailors by craft (Blouses, Maggam, Suits, Gowns)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {tailorSearchQuery && (
              <button
                type="button"
                onClick={() => setTailorSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button type="submit" variant="primary" size="sm" className="shrink-0">
            Explore
          </Button>
        </form>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('customer.dashboard.activeCommissions')}
          value={mockCustomerStats.activeOrders}
          icon={<ShoppingBag className="w-5 h-5 text-emerald-400" />}
          subtitle="In atelier production"
        />
        <StatCard
          title="Completed Garments"
          value={mockCustomerStats.completedGarments}
          icon={<Scissors className="w-5 h-5 text-teal-400" />}
          subtitle="Delivered & fitted"
        />
        <Link to="/dashboard/customer/measurements" className="block hover:opacity-90 transition-opacity">
          <StatCard
            title={t('customer.dashboard.savedMeasurements')}
            value={mockCustomerStats.savedMeasurements}
            icon={<Ruler className="w-5 h-5 text-amber-400" />}
            subtitle="Manage Dynamic Profiles →"
          />
        </Link>

        <StatCard
          title="Favorite Ateliers"
          value={mockCustomerStats.favoriteTailors}
          icon={<Star className="w-5 h-5 text-indigo-400" />}
          subtitle="Savile Row & Mayfair"
        />
      </div>

      {/* Active Orders Section with Integrated Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>{t('customer.dashboard.recentCommissions')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track multi-stage artisan handcrafting and delivery progress
            </p>
          </div>

          <Link to="/dashboard/customer/orders" className="text-xs text-emerald-400 hover:underline shrink-0">
            {t('common.all')} ({mockOrders.length} total orders) →
          </Link>
        </div>

        {/* Live Search Option for Recent Orders */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <SearchBar
            value={orderSearchQuery}
            onChange={setOrderSearchQuery}
            placeholder="Search recent orders by order # (e.g. TC-2026-899), garment (blouse, suit), or atelier..."
            className="flex-1"
          />
          {orderSearchQuery && (
            <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-400 shrink-0 px-1">
              <span>{filteredActiveOrders.length} matching {filteredActiveOrders.length === 1 ? 'order' : 'orders'}</span>
              <button
                type="button"
                onClick={() => setOrderSearchQuery('')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Order Cards List or Empty Search Feedback */}
        {filteredActiveOrders.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-2">
            <Search className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No orders match "{orderSearchQuery}"</p>
            <p className="text-xs text-slate-500">
              Try searching with an order ID (e.g. "TC-2026-899"), garment type ("Blouse", "Suit"), or atelier name.
            </p>
            <Button variant="outline" size="sm" onClick={() => setOrderSearchQuery('')} className="mt-2">
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActiveOrders.slice(0, 4).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={(ord) => setSelectedOrderForDetails(ord)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booked Appointments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>My Scheduled Fittings &amp; Appointments</span>
            </h2>
            <p className="text-xs text-slate-400">
              Verified tailor home visits, workshop fitting sessions, and consultations
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTailorForBooking(recommendedTailors[0]);
              setIsBookingModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Book New Fitting
          </Button>
        </div>

        {appointments.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No upcoming fittings booked</p>
            <p className="text-xs text-slate-500">Book an appointment with any verified atelier below for doorstep or studio measurements.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      #{apt.bookingNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        apt.status === 'Confirmed'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white tracking-tight">
                    {apt.tailorName}
                  </h4>
                  <p className="text-xs font-semibold text-emerald-300 mt-0.5">
                    {apt.garmentType}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{apt.date} • {apt.timeSlot}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {apt.fittingType === 'Doorstep Measuring' && <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {apt.fittingType === 'Atelier Visit' && <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                      {apt.fittingType === 'Virtual Video Consultation' && <Video className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      <span>{apt.fittingType}</span>
                    </div>
                    {apt.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1 line-clamp-1">
                        &quot;{apt.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Contact: {apt.customerPhone}
                  </span>
                  {apt.status === 'Confirmed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelAppointment(apt.id)}
                      className="text-slate-400 hover:text-rose-400 text-xs"
                    >
                      Cancel Fitting
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Nearby Tailors Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>{t('customer.dashboard.nearbyAteliers')}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Master tailors located near your residence
            </p>
          </div>
          <Link to="/dashboard/customer/nearby">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {t('customer.dashboard.exploreAteliers')}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendedTailors.map((tailor) => (
            <TailorCard
              key={tailor.id}
              tailor={tailor}
              onBook={(t) => {
                setSelectedTailorForBooking(t);
                setIsBookingModalOpen(true);
              }}
              onSelect={(t) => setSelectedTailorProfile(t)}
            />
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      <BookAppointmentModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        tailor={selectedTailorForBooking}
        onBookingConfirmed={handleBookingConfirmed}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrderForDetails)}
        onClose={() => setSelectedOrderForDetails(null)}
        order={selectedOrderForDetails}
      />

      {/* Tailor Quick Profile Modal */}
      {selectedTailorProfile && (
        <Modal
          isOpen={Boolean(selectedTailorProfile)}
          onClose={() => setSelectedTailorProfile(null)}
          title={selectedTailorProfile.shopName}
          description={`Master Cutter: ${selectedTailorProfile.name} • ${selectedTailorProfile.location.city}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="h-48 rounded-xl overflow-hidden relative">
              <img
                src={selectedTailorProfile.coverImage}
                alt={selectedTailorProfile.shopName}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedTailorProfile.bio}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedTailorProfile.specialties.map((sp) => (
                <span
                  key={sp}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-300 border border-slate-700 text-xs font-medium"
                >
                  {sp}
                </span>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Starting From</span>
                <span className="font-mono font-bold text-white text-base">${selectedTailorProfile.startingPrice}</span>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  const t = selectedTailorProfile;
                  setSelectedTailorProfile(null);
                  setSelectedTailorForBooking(t);
                  setIsBookingModalOpen(true);
                }}
              >
                Book Appointment With Atelier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
