import React, { useState, useEffect } from 'react';
import { api } from '@tailorconnect/api-client';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { ShieldCheck, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';

export function TailorProfileSettingsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable fields
  const [description, setDescription] = useState('');
  const [typicalTurnaroundDays, setTypicalTurnaroundDays] = useState(7);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);
  const [offersHomePickup, setOffersHomePickup] = useState(false);
  const [offersHomeDelivery, setOffersHomeDelivery] = useState(false);

  // New Portfolio Item
  const [newTitle, setNewTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Bridal');

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.businesses.getMyBusiness();
      if (res.success && res.data) {
        setBusiness(res.data);
        setDescription(res.data.description || '');
        setTypicalTurnaroundDays(res.data.typicalTurnaroundDays || 7);
        setServiceRadiusKm(res.data.serviceRadiusKm || 15);
        setOffersHomePickup(!!res.data.offersHomePickup);
        setOffersHomeDelivery(!!res.data.offersHomeDelivery);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.businesses.updateMyBusiness({
        description,
        typicalTurnaroundDays: Number(typicalTurnaroundDays),
        serviceRadiusKm: parseFloat(String(serviceRadiusKm)),
        offersHomePickup,
        offersHomeDelivery,
      });
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newImageUrl.trim()) return;
    try {
      await api.businesses.addPortfolioItem({
        title: newTitle.trim(),
        imageUrl: newImageUrl.trim(),
        category: newCategory,
      });
      setNewTitle('');
      setNewImageUrl('');
      await loadProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    try {
      await api.businesses.deletePortfolioItem(id);
      await loadProfile();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-500">Loading studio settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            {business?.name || 'Studio Settings'}
          </h1>
          <Badge variant="gold">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            {business?.verificationStatus}
          </Badge>
        </div>
        <p className="text-stone-500 text-sm mt-1">
          Manage turnaround days, service radius, home visits, and portfolio gallery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Studio Parameters Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Studio Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <Textarea
                label="Studio Description / Bio"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  label="Typical Turnaround (Days)"
                  value={typicalTurnaroundDays}
                  onChange={(e) => setTypicalTurnaroundDays(parseInt(e.target.value) || 7)}
                />
                <Input
                  type="number"
                  label="Service Radius (km)"
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(parseFloat(e.target.value) || 15)}
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offersHomePickup}
                    onChange={(e) => setOffersHomePickup(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 rounded"
                  />
                  <span className="font-medium text-stone-700">Offers Free Home Fabric Pickup</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offersHomeDelivery}
                    onChange={(e) => setOffersHomeDelivery(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 rounded"
                  />
                  <span className="font-medium text-stone-700">Offers Doorstep Garment Delivery</span>
                </label>
              </div>

              {saveSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Studio settings saved successfully!</span>
                </div>
              )}

              <Button type="submit" size="sm" isLoading={isSaving} className="w-full">
                Save Studio Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Portfolio Upload Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Portfolio Showcase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddPortfolio} className="space-y-3 text-xs p-3 rounded-xl bg-stone-50 border border-stone-200">
              <p className="font-semibold text-stone-900">Add New Portfolio Item</p>
              <Input
                placeholder="Title (e.g. Zardosi Velvet Blouse)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <Input
                placeholder="Image URL (Unsplash or direct image URL)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                required
              />
              <div className="flex justify-between items-center gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="p-2 rounded-lg border border-stone-200 bg-white text-xs flex-1"
                >
                  <option value="Bridal">Bridal</option>
                  <option value="Blouse">Blouse</option>
                  <option value="Lehenga">Lehenga</option>
                  <option value="Men's Wear">Men's Wear</option>
                </select>
                <Button type="submit" size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Photo
                </Button>
              </div>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {business?.portfolioItems?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border border-stone-200 text-xs bg-white">
                  <div className="flex items-center gap-2.5">
                    <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-md object-cover" />
                    <div>
                      <p className="font-semibold text-stone-900 line-clamp-1">{item.title}</p>
                      <span className="text-[10px] text-stone-500">{item.category}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePortfolio(item.id)}
                    className="p-1 text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
