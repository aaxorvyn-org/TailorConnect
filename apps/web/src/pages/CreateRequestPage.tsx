import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@tailorconnect/api-client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import {
  Sparkles,
  Scissors,
  Calendar,
  IndianRupee,
  MapPin,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';

export function CreateRequestPage() {
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';
  const initialTailorName = searchParams.get('name') || '';

  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [promptText, setPromptText] = useState(initialPrompt);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted / Editable Fields
  const [garmentType, setGarmentType] = useState('Bridal Blouse');
  const [categoryName, setCategoryName] = useState("Women's Wear");
  const [sleeveStyle, setSleeveStyle] = useState('Elbow length');
  const [necklineStyle, setNecklineStyle] = useState('Sweetheart');
  const [fabricProvided, setFabricProvided] = useState(true);
  const [embroidery, setEmbroidery] = useState(true);
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high'>('high');

  // Dates & Budget
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  const [requiredDate, setRequiredDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [budgetMin, setBudgetMin] = useState('1500');
  const [budgetMax, setBudgetMax] = useState('2200');

  // Location & Services
  const [locationCity, setLocationCity] = useState(user?.profile?.city || 'Hyderabad');
  const [locationLocality, setLocationLocality] = useState(user?.profile?.approxLocation || 'Madhapur');
  const [pickupRequired, setPickupRequired] = useState(true);
  const [deliveryRequired, setDeliveryRequired] = useState(true);

  // Image URLs
  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // AI Extraction Handler
  const handleExtractAI = async () => {
    if (!promptText.trim()) return;
    setIsExtracting(true);
    setError(null);
    try {
      const res = await api.ai.extractRequirements(promptText);
      if (res.success && res.data) {
        const d = res.data;
        setGarmentType(d.garmentType || 'Custom Garment');
        setCategoryName(d.category || "Women's Wear");
        if (d.sleeveStyle) setSleeveStyle(d.sleeveStyle);
        if (d.necklineStyle) setNecklineStyle(d.necklineStyle);
        setFabricProvided(d.fabricProvidedByCustomer);
        setEmbroidery(!!d.embroidery);
        setUrgency(d.urgency || 'normal');

        if (d.detectedTurnaroundDays) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + d.detectedTurnaroundDays);
          setRequiredDate(targetDate.toISOString().split('T')[0]);
        }

        if (d.suggestedBudget) {
          setBudgetMin(String(d.suggestedBudget.min));
          setBudgetMax(String(d.suggestedBudget.max));
        }
      }
    } catch (e: any) {
      setError(e.message || 'AI extraction failed. You can still fill out the fields manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  // Submit Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=/app/requests/new');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.requests.create({
        garmentType,
        categoryName,
        rawPrompt: promptText || `${garmentType} in ${categoryName}`,
        structuredRequirements: {
          garmentType,
          category: categoryName,
          sleeveStyle,
          necklineStyle,
          fabricProvidedByCustomer: fabricProvided,
          embroidery,
          urgency,
        },
        fabricProvidedByCustomer: fabricProvided,
        requiredDate,
        budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
        budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
        pickupRequired,
        deliveryRequired,
        locationCity,
        locationLocality,
        imageUrls,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to submit request');
      }

      navigate(`/app/requests/${res.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <Badge variant="gold" className="mb-2">Stitching Request Intake</Badge>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          What do you want stitched?
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {initialTailorName
            ? `Submitting requirement directly for review by ${initialTailorName}`
            : 'Describe your garment naturally. We will extract specifications and find capable nearby tailors.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Natural Language Prompt Intake */}
        <Card className="border-amber-200/80 bg-gradient-to-b from-amber-50/30 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Step 1: Describe What You Need in Plain Words
              </CardTitle>
              <Badge variant="gold" className="text-[10px]">AI-Assisted</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. I need a bridal blouse for my sister's wedding. I have the raw silk fabric. I want elbow sleeves, heavy zardosi embroidery and need it ready by next Friday."
              rows={3}
              className="text-stone-800"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-stone-500">
                You can edit any detected details before submitting.
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleExtractAI}
                isLoading={isExtracting}
                disabled={!promptText.trim()}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-white" />
                Analyze Requirements with AI
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Extracted & Editable Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="w-4 h-4 text-slate-800" />
              Step 2: Garment Specifications (Review & Adjust)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Garment Type"
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                placeholder="e.g. Bridal Blouse, Sherwani, Lehenga"
                required
              />
              <Input
                label="Category / Occasion"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Women's Wear, Wedding, Festive"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Sleeve Styling"
                value={sleeveStyle}
                onChange={(e) => setSleeveStyle(e.target.value)}
                placeholder="e.g. Elbow length, Sleeveless, 3/4th"
              />
              <Input
                label="Neckline Pattern"
                value={necklineStyle}
                onChange={(e) => setNecklineStyle(e.target.value)}
                placeholder="e.g. Sweetheart, Boat Neck, Deep Back"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Fabric provided toggle */}
              <div className="p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-stone-900">Fabric Provided by You?</p>
                  <p className="text-[11px] text-stone-500">I already have the cloth / materials</p>
                </div>
                <input
                  type="checkbox"
                  checked={fabricProvided}
                  onChange={(e) => setFabricProvided(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 rounded"
                />
              </div>

              {/* Handwork / Embroidery */}
              <div className="p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-stone-900">Includes Embroidery / Maggam Work?</p>
                  <p className="text-[11px] text-stone-500">Requires hand detailing</p>
                </div>
                <input
                  type="checkbox"
                  checked={embroidery}
                  onChange={(e) => setEmbroidery(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Reference Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-800" />
              Step 3: Reference Photos & Sketches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste reference image URL or inspiration link..."
              />
              <Button type="button" variant="outline" onClick={handleAddImage}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            {/* Photo Previews */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative h-28 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group">
                  <img src={url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Schedule, Budget & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-800" />
              Step 4: Deadline, Budget & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                type="date"
                label="Required By Date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                required
              />
              <Input
                type="number"
                label="Budget Min (₹)"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
              <Input
                type="number"
                label="Budget Max (₹)"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Locality / Neighborhood"
                value={locationLocality}
                onChange={(e) => setLocationLocality(e.target.value)}
                placeholder="e.g. Madhapur, Banjara Hills"
                required
              />
              <Input
                label="City"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g. Hyderabad"
                required
              />
            </div>

            <div className="flex gap-4 pt-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pickupRequired}
                  onChange={(e) => setPickupRequired(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 rounded"
                />
                <span className="font-medium text-stone-700">Need doorstep fabric pickup</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryRequired}
                  onChange={(e) => setDeliveryRequired(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 rounded"
                />
                <span className="font-medium text-stone-700">Need doorstep garment delivery</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" size="lg" isLoading={isSubmitting}>
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
            Submit Stitching Request
          </Button>
        </div>
      </form>
    </div>
  );
}
