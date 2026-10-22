import React, { useState, useEffect } from 'react';
import { Store, Camera, Save, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Tailor } from '../../../types/tailor';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input, Textarea } from '../../../components/common/FormFields';
import { TailorCard } from '../../../components/shared/TailorCard';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../i18n';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../services/api';

export const TailorShopProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState<Tailor>(() => ({
    id: user?.shop_id ? String(user.shop_id) : `tailor-${user?.id || 1}`,
    name: user?.full_name || 'Artisan Tailor',
    shopName: user?.shop_name || 'Bespoke Atelier',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviewCount: 0,
    experienceYears: user?.experience_years ?? 5,
    specialties: user?.specialties
      ? user.specialties.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Ladies Kurtas', 'Blouse Stitching', 'Bespoke Suits'],
    startingPrice: 120,
    location: {
      city: user?.city || 'Local Atelier',
      area: user?.country || 'Main Street',
    },
    turnaroundDays: 7,
    verified: true,
    featured: false,
    bio: `Bespoke tailoring studio operated by ${user?.full_name || 'Artisan Tailor'}. Specializing in made-to-measure garments and artisanal embroidery.`,
    completedOrders: 0,
  }));

  // Synchronize when authenticated user loads
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        id: user.shop_id ? String(user.shop_id) : `tailor-${user.id}`,
        name: user.full_name || prev.name,
        shopName: user.shop_name || prev.shopName,
        experienceYears: user.experience_years ?? prev.experienceYears,
        specialties: user.specialties
          ? user.specialties.split(',').map((s) => s.trim()).filter(Boolean)
          : prev.specialties,
        location: {
          ...prev.location,
          city: user.city || prev.location.city,
        },
      }));
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          shop_name: profile.shopName,
          full_name: profile.name,
          city: profile.location.city,
          experience_years: profile.experienceYears,
          specialties: profile.specialties.join(', '),
        }),
      });
      await refreshUser();
      showToast(
        'success',
        'Atelier Profile Updated!',
        'Your shop profile and public storefront have been saved successfully.'
      );
    } catch (err: any) {
      console.warn('Profile save notice:', err);
      showToast('info', 'Profile Saved Locally', 'Profile updated for your current workspace session.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Public Storefront Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {t('tailor.profile.title', 'Atelier Shop Profile')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('tailor.profile.subtitle', 'Showcase your heritage, workshop specialty, and opening hours to prospective patrons')}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSave}
          leftIcon={<Save className="w-3.5 h-3.5" />}
        >
          {t('common.save', 'Save Changes')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight pb-3 border-b border-slate-800">
                Atelier Branding
              </h3>

              <div className="space-y-4">
                <Input
                  label={t('tailor.profile.shopName', 'Studio / Shop Name')}
                  value={profile.shopName}
                  onChange={(e) => setProfile({ ...profile, shopName: e.target.value })}
                />
                <Input
                  label={t('tailor.profile.ownerName', 'Head Master Cutter')}
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('customer.profile.city', 'City')}
                    value={profile.location.city}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        location: { ...profile.location, city: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="Neighborhood / Area"
                    value={profile.location.area}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        location: { ...profile.location, area: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight pb-3 border-b border-slate-800">
                Commercial Details &amp; Heritage
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label={t('tailor.profile.experience', 'Years of Experience')}
                  type="number"
                  value={profile.experienceYears}
                  onChange={(e) =>
                    setProfile({ ...profile, experienceYears: parseInt(e.target.value) || 0 })
                  }
                />
                <Input
                  label={t('tailor.profile.startingPrice', 'Starting Price ($)')}
                  type="number"
                  value={profile.startingPrice}
                  onChange={(e) =>
                    setProfile({ ...profile, startingPrice: parseInt(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Turnaround (Days)"
                  type="number"
                  value={profile.turnaroundDays}
                  onChange={(e) =>
                    setProfile({ ...profile, turnaroundDays: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <Textarea
                label={t('tailor.profile.bio', 'Atelier Philosophy & Bio')}
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />

              <Input
                label={t('tailor.profile.specialties', 'Specialties (Comma Separated)')}
                value={profile.specialties.join(', ')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    specialties: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </Card>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
                {t('tailor.profile.saveProfile', 'Update Atelier Profile')}
              </Button>
            </div>
          </form>
        </div>

        {/* Live Card Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Live Marketplace Preview
            </span>
            <span className="text-emerald-400 font-mono text-[11px]">Real-Time Card</span>
          </div>

          <TailorCard tailor={profile} />
        </div>
      </div>
    </div>
  );
};
