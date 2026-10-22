import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Tag, 
  Heart, 
  Trash2, 
  Upload, 
  Video, 
  Play, 
  Image as ImageIcon, 
  X, 
  Check, 
  Film, 
  Eye, 
  Sparkles,
  Camera,
  AlertCircle,
  Inbox,
  Loader2
} from 'lucide-react';
import { mockDesigns } from '../../../mock';
import type { Design } from '../../../types/design';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { Input, Textarea, Select } from '../../../components/common/FormFields';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../i18n';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../services/api';

// Sample Atelier Studio Presets for instant selection
const WORKSHOP_IMAGE_PRESETS = [
  {
    name: 'Contemporary Ladies Kurta Formal Dress',
    url: '/designs/ladies-kurta-formal-dress.jpg',
    category: 'Ladies Kurtas & Ethnic',
    tags: 'Ladies Kurta, Formal Dress, Contemporary Formal, Silk Kurta',
  },
  {
    name: 'Handcrafted Lucknowi Chikankari Ladies Kurta',
    url: '/designs/ladies-chikankari-kurta.jpg',
    category: 'Traditional',
    tags: 'Ladies Kurta, Chikankari, Chanderi Silk, Kurti',
  },
  {
    name: 'Artisan Heirloom Doll Dress',
    url: '/designs/miniature-doll-dress.jpg',
    category: 'Women Couture',
    tags: 'Miniature Couture, French Lace, Hand Pearls',
  },
  {
    name: 'Woman Taking Anatomical Measurements',
    url: '/designs/woman-taking-measurements.jpg',
    category: 'Alterations',
    tags: '32-Point Measuring, Doorstep Fitting, Couture',
  },
  {
    name: 'Master Tailor Hand-Shear Cutting',
    url: '/designs/tailor-cutting-cloth.jpg',
    category: 'Men Suits',
    tags: 'Hand Sheared, Tailor Chalk, Savile Row',
  },
  {
    name: 'Emerald Silk Velvet Tuxedo',
    url: '/designs/emerald-silk-tuxedo.jpg',
    category: 'Formal Wear',
    tags: 'Silk Velvet, Shawl Lapel, Savile Row',
  },
  {
    name: 'Camel Cashmere Tailored Trench',
    url: '/designs/cashmere-tailored-trench.jpg',
    category: 'Formal Wear',
    tags: 'Double-Faced Cashmere, Horn Buckle, Pick Stitching',
  },
  {
    name: 'Bridal Crimson Maggam Blouse',
    url: '/blouses/bridal-maggam-blouse.jpg',
    category: 'Blouse Stitching',
    tags: 'Maggam Work, Zardozi, Raw Silk',
  },
  {
    name: 'Emerald Peacock Silk Blouse',
    url: '/blouses/emerald-peacock-blouse.jpg',
    category: 'Blouse Stitching',
    tags: 'Peacock Motif, Scallop Border, Aari',
  },
  {
    name: 'Royal Blue Princess Cut Blouse',
    url: '/blouses/royal-blue-princess-blouse.jpg',
    category: 'Blouse Stitching',
    tags: 'Princess Cut, Latkan Dori, Zari',
  },
  {
    name: 'Blush Pink Sweetheart Blouse',
    url: '/blouses/blush-pink-sweetheart-blouse.jpg',
    category: 'Blouse Stitching',
    tags: 'Sweetheart Neck, French Knot, Padded',
  },
  {
    name: 'Midnight Navy Bespoke Suit',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
    category: 'Men Suits',
    tags: 'Super 150s Wool, Full Canvas, Peak Lapel',
  },
  {
    name: 'Ivory Chantilly Lace Bridal Gown',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    category: 'Women Couture',
    tags: 'French Lace, Hand Beaded, Cathedral Train',
  },
];

export const TailorDesignsPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Video preview player modal state
  const [videoModalDesign, setVideoModalDesign] = useState<Design | null>(null);

  // File input refs
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Media Tab Modes
  const [imageMode, setImageMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [videoMode, setVideoMode] = useState<'upload' | 'url'>('upload');

  // Media Previews
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');

  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [customVideoUrl, setCustomVideoUrl] = useState<string>('');

  // Form Fields
  const [newDesign, setNewDesign] = useState({
    title: '',
    category: 'Ladies Kurtas & Ethnic' as Design['category'],
    priceEstimate: '185',
    tags: 'Ladies Kurta, Formal Dress, Contemporary Formal, Silk Kurta',
    description: '',
    fabricOptions: 'Tussar Raw Silk, Italian Crepe, Pure Chanderi',
  });

  // Fetch designs belonging ONLY to this tailor from real API / local storage
  useEffect(() => {
    let isCancelled = false;

    const fetchDesigns = async () => {
      setIsLoading(true);
      try {
        let fetched: any[] = [];
        if (user && user.role === 'TAILOR') {
          try {
            fetched = await apiClient<any[]>('/designs/my');
          } catch (apiErr) {
            console.warn('API /designs/my call notice:', apiErr);
          }
        }

        // Check user-scoped local storage for any custom designs saved locally
        const storageKey = user?.id ? `threadcraft_designs_user_${user.id}` : 'threadcraft_custom_designs';
        let localCustom: any[] = [];
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) localCustom = parsed;
          }
        } catch (e) {
          console.warn('Could not read local designs', e);
        }

        if (!isCancelled) {
          const combinedMap = new Map<string, Design>();
          if (Array.isArray(fetched)) {
            fetched.forEach((d) => {
              combinedMap.set(String(d.id), {
                ...d,
                image: d.image_url || d.image,
                priceEstimate: d.price_from || d.priceEstimate,
                category: d.category_name || d.category || 'Traditional',
                tags: Array.isArray(d.tags) ? d.tags : (d.tags ? d.tags.split(',').map((t: string) => t.trim()) : []),
                fabricOptions: d.fabric ? d.fabric.split(',').map((f: string) => f.trim()) : [],
              });
            });
          }

          localCustom.forEach((d) => {
            if (!combinedMap.has(String(d.id))) {
              combinedMap.set(String(d.id), d);
            }
          });

          const userDesigns = Array.from(combinedMap.values());

          // Only fallback to mockDesigns if explicitly the legacy demo account
          if (userDesigns.length === 0 && user?.email === 'master.vance@vanceatelier.com') {
            setDesigns(mockDesigns);
          } else {
            setDesigns(userDesigns);
          }
        }
      } catch (err) {
        console.error('Failed fetching atelier designs:', err);
        if (!isCancelled) {
          if (user?.email === 'master.vance@vanceatelier.com') {
            setDesigns(mockDesigns);
          } else {
            setDesigns([]);
          }
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchDesigns();
    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Handle Photo File Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      setImageFileName(file.name);
      showToast('success', 'Photo Selected', `${file.name} ready for publish.`);
    };
    reader.readAsDataURL(file);
  };

  // Handle Video File Upload
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast('error', 'Invalid File', 'Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoPreview(objectUrl);
    setVideoFileName(file.name);
    showToast('success', 'Video Loaded', `${file.name} ready for preview.`);
  };

  // Handle Image Preset Selection
  const handleSelectPreset = (preset: typeof WORKSHOP_IMAGE_PRESETS[0]) => {
    setImagePreview(preset.url);
    setImageFileName(preset.name);
    setNewDesign((prev) => ({
      ...prev,
      category: preset.category as any,
      tags: prev.tags ? prev.tags : preset.tags,
    }));
    showToast('info', 'Preset Applied', `Loaded "${preset.name}".`);
  };

  // Handle Create Design
  const handleCreateDesign = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalImage = imageMode === 'url' && customImageUrl.trim()
      ? customImageUrl.trim()
      : imagePreview;

    if (!finalImage) {
      showToast('error', 'Photo Required', 'Please upload or select a garment photo before publishing.');
      return;
    }

    const finalVideo = videoMode === 'url' && customVideoUrl.trim()
      ? customVideoUrl.trim()
      : videoPreview;

    const tempId = `design-${Date.now()}`;
    const created: Design = {
      id: tempId,
      title: newDesign.title || 'Handcrafted Bespoke Garment',
      category: newDesign.category,
      shop_id: user?.shop_id || undefined,
      tailorId: user?.shop_id ? String(user.shop_id) : String(user?.id || 'my-shop'),
      tailorName: user?.shop_name || user?.full_name || 'My Atelier',
      image: finalImage,
      image_url: finalImage,
      video: finalVideo || undefined,
      video_url: finalVideo || undefined,
      priceEstimate: parseFloat(newDesign.priceEstimate) || 185,
      price_from: parseFloat(newDesign.priceEstimate) || 185,
      tags: newDesign.tags.split(',').map((t) => t.trim()).filter(Boolean),
      fabricOptions: newDesign.fabricOptions.split(',').map((f) => f.trim()).filter(Boolean),
      fabric: newDesign.fabricOptions,
      description: newDesign.description || 'Custom crafted bespoke garment tailored with precision fit and luxury finishing.',
      likes: 0,
    };

    // Save to state immediately
    setDesigns((prev) => [created, ...prev]);

    // Save to user-scoped localStorage
    const storageKey = user?.id ? `threadcraft_designs_user_${user.id}` : 'threadcraft_custom_designs';
    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const filtered = Array.isArray(existing) ? existing.filter((d: any) => String(d.id) !== tempId) : [];
      localStorage.setItem(storageKey, JSON.stringify([created, ...filtered]));
    } catch (err) {
      console.warn('Failed saving to localStorage:', err);
    }

    // Persist to backend database API
    try {
      const saved = await apiClient<any>('/designs', {
        method: 'POST',
        body: JSON.stringify({
          shop_id: user?.shop_id || undefined,
          category: created.category,
          title: created.title,
          description: created.description,
          price_from: created.priceEstimate ?? 185,
          price_to: (created.priceEstimate ?? 185) * 1.3,
          fabric: Array.isArray(created.fabricOptions) ? created.fabricOptions.join(', ') : created.fabric,
          image_url: created.image,
          tags: Array.isArray(created.tags) ? created.tags.join(', ') : created.tags,
        }),
      });
      if (saved && saved.id) {
        setDesigns((prev) => prev.map((d) => (d.id === tempId ? { ...d, id: saved.id } : d)));
        try {
          const currentStored = JSON.parse(localStorage.getItem(storageKey) || '[]');
          if (Array.isArray(currentStored)) {
            const updated = currentStored.map((d: any) => (d.id === tempId ? { ...d, id: saved.id } : d));
            localStorage.setItem(storageKey, JSON.stringify(updated));
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Backend design sync notice:', err);
    }

    setAddModalOpen(false);

    // Reset form fields
    setNewDesign({
      title: '',
      category: 'Ladies Kurtas & Ethnic',
      priceEstimate: '185',
      tags: 'Ladies Kurta, Formal Dress, Contemporary Formal, Silk Kurta',
      description: '',
      fabricOptions: 'Tussar Raw Silk, Italian Crepe, Pure Chanderi',
    });
    setVideoPreview('');
    setVideoFileName('');
    setCustomVideoUrl('');

    showToast(
      'success',
      'Design Published',
      `"${created.title}" with photo${created.video ? ' and video reel' : ''} is now active in your lookbook and storefront.`
    );
  };

  const handleDelete = async (id: string | number) => {
    try {
      await apiClient(`/designs/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete design call notice:', err);
    }

    setDesigns((prev) => prev.filter((d) => String(d.id) !== String(id)));
    const storageKey = user?.id ? `threadcraft_designs_user_${user.id}` : 'threadcraft_custom_designs';
    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(existing)) {
        const updated = existing.filter((d: any) => String(d.id) !== String(id));
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Failed updating localStorage on delete:', err);
    }
    showToast('info', 'Design Archived', 'Removed item from active atelier portfolio.');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Portfolio Showcase • {user?.shop_name || 'My Atelier'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {t('tailor.designs.title', 'Atelier Design Lookbook')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('tailor.designs.subtitle', 'Display your signature cuts, lapel architectures, and textile compositions to prospective patrons.')}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setAddModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          {t('tailor.designs.addNew', 'Publish New Design')}
        </Button>
      </div>

      {/* Grid or Clean Empty State */}
      {isLoading ? (
        <div className="p-16 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-semibold">Loading your atelier lookbook...</p>
        </div>
      ) : designs.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">Your Atelier Lookbook is Empty</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              No designs have been published to <span className="text-indigo-300 font-semibold">{user?.shop_name || 'your shop'}</span> yet. Publish your bespoke blouses, kurtas, suits, or craftsmanship reels to showcase them to patrons in real time.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => setAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Publish Your First Design
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <Card key={design.id} className="p-0 overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-900">
                  <img
                    src={design.image || design.image_url || '/designs/ladies-kurta-formal-dress.jpg'}
                    alt={design.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Category badge */}
                  <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                    {design.category || design.category_name || 'Bespoke'}
                  </span>

                  {/* Likes count */}
                  <div className="absolute top-3 right-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-xs text-rose-300 border border-slate-800">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>{design.likes ?? 0}</span>
                  </div>

                  {/* Video Reel Badge if video attached */}
                  {Boolean(design.video || design.video_url) && (
                    <button
                      type="button"
                      onClick={() => setVideoModalDesign(design)}
                      className="absolute bottom-3 right-3 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/90 hover:bg-emerald-500 hover:text-slate-950 backdrop-blur-md text-xs font-bold text-amber-300 hover:border-emerald-400 border border-amber-500/30 transition-all shadow-lg"
                      title="Play Craftsmanship Video"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Watch Video</span>
                    </button>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {design.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {design.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(Array.isArray(design.tags)
                      ? design.tags
                      : typeof design.tags === 'string'
                      ? design.tags.split(',').map((t) => t.trim()).filter(Boolean)
                      : []
                    ).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Commission Est.</span>
                  <span className="text-sm font-bold text-white font-mono">${design.priceEstimate || design.price_from || 0}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {Boolean(design.video || design.video_url) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVideoModalDesign(design)}
                      className="text-amber-400 hover:text-amber-300 text-xs"
                      leftIcon={<Film className="w-3.5 h-3.5" />}
                    >
                      Video
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(String(design.id))}
                    className="text-slate-400 hover:text-rose-400"
                    title="Archive Design"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Design Modal with Dedicated Photo & Video Upload Headings */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Bespoke Design"
        description="Upload photos, craftmanship video reels, and tailoring details to publish to your public lookbook."
        size="xl"
      >
        <form onSubmit={handleCreateDesign} className="space-y-6 max-h-[78vh] overflow-y-auto pr-1">
          
          {/* ========================================================================= */}
          {/* HEADING 1: PHOTO UPLOAD SECTION (REQUIRED)                                 */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    1. Upload Garment Photograph
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    Required
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload high-resolution photographs of the blouse, suit, or handcrafted embroidery.
                </p>
              </div>

              {/* Mode switch */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    imageMode === 'upload'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('presets')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    imageMode === 'presets'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Studio Samples
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    imageMode === 'url'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {/* Mode 1: File Upload Drag/Click Zone */}
            {imageMode === 'upload' && (
              <div className="space-y-3">
                {imagePreview ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <img
                      src={imagePreview}
                      alt="Garment Preview"
                      className="w-24 h-24 rounded-lg object-cover ring-1 ring-emerald-500/40 shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                        <Check className="w-3.5 h-3.5" /> Photo Loaded Successfully
                      </span>
                      <p className="text-xs font-bold text-white truncate">{imageFileName}</p>
                      <p className="text-[11px] text-slate-400">Ready for high-res publication in your catalog.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => imageFileInputRef.current?.click()}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      Upload Image
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => imageFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-750 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-white">
                      Click to choose garment photo or drag &amp; drop
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Supports JPG, PNG, WEBP • Max 15MB
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Studio Preset Samples */}
            {imageMode === 'presets' && (
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 block">
                  Select an authentic real stitching photo from our workshop collection:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {WORKSHOP_IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                        imagePreview === preset.url
                          ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-white truncate">{preset.name}</div>
                        <div className="text-[10px] text-emerald-400 truncate">{preset.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 3: Image URL Input */}
            {imageMode === 'url' && (
              <div className="space-y-3">
                <Input
                  label="Direct Image URL"
                  placeholder="https://example.com/blouse-image.jpg or /blouses/bridal-maggam-blouse.jpg"
                  value={customImageUrl}
                  onChange={(e) => {
                    setCustomImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                />
                {customImageUrl && (
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
                    <img
                      src={customImageUrl}
                      alt="URL Preview"
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                      onError={() => showToast('error', 'Invalid Image', 'Could not load image from provided URL.')}
                    />
                    <div className="text-xs text-slate-300">
                      Live preview loaded from URL.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* HEADING 2: VIDEO UPLOAD SECTION (OPTIONAL)                                */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <Film className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    2. Upload Craftsmanship Video
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Optional / Reels
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload a short video or Reel showcasing 360° needlework, latkan movement, or stitching process.
                </p>
              </div>

              {/* Video mode switch */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setVideoMode('upload')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    videoMode === 'upload'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload Video Clip
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode('url')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    videoMode === 'url'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Video URL
                </button>
              </div>
            </div>

            {/* Hidden native video input */}
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime"
              className="hidden"
              onChange={handleVideoFileChange}
            />

            {/* Video Preview Player if video attached */}
            {videoPreview ? (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-amber-300 font-semibold">
                    <Video className="w-4 h-4" />
                    <span>{videoFileName || 'Craftsmanship Video Reel Loaded'}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setVideoPreview('');
                      setVideoFileName('');
                      setCustomVideoUrl('');
                    }}
                    className="text-slate-400 hover:text-rose-400 text-xs"
                    leftIcon={<X className="w-3.5 h-3.5" />}
                  >
                    Remove Video
                  </Button>
                </div>

                <div className="rounded-xl overflow-hidden bg-black border border-slate-850 max-h-56 flex items-center justify-center">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-56 object-contain"
                  />
                </div>
              </div>
            ) : (
              <div>
                {videoMode === 'upload' ? (
                  <div
                    onClick={() => videoFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-750 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-950 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Video className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-white">
                      Click to choose craftsmanship video or drag &amp; drop
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Supports MP4, WebM, MOV • Max 50MB • Vertical or Landscape
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      label="Video Direct URL"
                      placeholder="https://example.com/tailoring-reel.mp4 or YouTube embed"
                      value={customVideoUrl}
                      onChange={(e) => {
                        setCustomVideoUrl(e.target.value);
                        setVideoPreview(e.target.value);
                        setVideoFileName('Direct Web Video');
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* HEADING 3: GARMENT SPECIFICATIONS & PRICING                                */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  3. Garment Specifications &amp; Pricing
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Define the garment title, fabric compatibility, and base tailoring estimation.
              </p>
            </div>

            <Input
              label={t('tailor.designs.designTitle', 'Garment Title')}
              placeholder="e.g. Royal Crimson Hand-Embroidered Maggam Silk Blouse"
              required
              value={newDesign.title}
              onChange={(e) => setNewDesign({ ...newDesign, title: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t('tailor.designs.category', 'Category')}
                value={newDesign.category}
                onChange={(e) => setNewDesign({ ...newDesign, category: e.target.value as any })}
                options={[
                  { value: 'Blouse Stitching', label: '✨ Ladies Blouse Stitching' },
                  { value: 'Women Couture', label: 'Women Couture' },
                  { value: 'Men Suits', label: 'Men Suits' },
                  { value: 'Formal Wear', label: 'Formal Wear' },
                  { value: 'Traditional', label: 'Traditional' },
                  { value: 'Alterations', label: 'Alterations' },
                ]}
              />
              <Input
                label={t('tailor.designs.priceFrom', 'Estimated Base Price ($)')}
                type="number"
                required
                value={newDesign.priceEstimate}
                onChange={(e) => setNewDesign({ ...newDesign, priceEstimate: e.target.value })}
              />
            </div>

            <Input
              label={t('tailor.designs.tags', 'Tags / Style (Comma Separated)')}
              placeholder="Aari Work, Zardozi, Princess Cut, Sweetheart Neck"
              value={newDesign.tags}
              onChange={(e) => setNewDesign({ ...newDesign, tags: e.target.value })}
            />

            <Input
              label={t('tailor.designs.fabric', 'Fabric / Material Options')}
              placeholder="Pure Raw Silk, Kanjeevaram Brocade, Velvet Trim"
              value={newDesign.fabricOptions}
              onChange={(e) => setNewDesign({ ...newDesign, fabricOptions: e.target.value })}
            />

            <Textarea
              label={t('tailor.designs.description', 'Design Description & Craftsmanship Details')}
              rows={3}
              placeholder="Details about neckline depth, latkan dori, padded cups, canvas reinforcement, and embroidery needlework..."
              required
              value={newDesign.description}
              onChange={(e) => setNewDesign({ ...newDesign, description: e.target.value })}
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {videoPreview ? '✨ Photo & Video ready' : '📸 Photo ready for lookbook'}
            </span>
            <div className="flex items-center space-x-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddModalOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" variant="primary" size="md" leftIcon={<Sparkles className="w-4 h-4" />}>
                {t('tailor.designs.saveDesign', 'Publish to Atelier Lookbook')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Video Playback Modal */}
      {videoModalDesign && (
        <Modal
          isOpen={Boolean(videoModalDesign)}
          onClose={() => setVideoModalDesign(null)}
          title={`Craftsmanship Video: ${videoModalDesign.title}`}
          description={`${videoModalDesign.category} • Handcrafted by ${videoModalDesign.tailorName || 'Atelier'}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-black border border-slate-800">
              <video
                src={videoModalDesign.video || videoModalDesign.video_url}
                controls
                autoPlay
                className="w-full max-h-[60vh] object-contain"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-300">
                {videoModalDesign.description}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setVideoModalDesign(null)}>
                Close Player
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
