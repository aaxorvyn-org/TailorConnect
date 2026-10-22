import { apiClient } from './api';
import type { NearbyTailor, Tailor } from '../types/tailor';
import type { Design } from '../types/design';
import { mockTailors } from '../mock/tailors';
import { mockDesigns } from '../mock/designs';

export interface NearbyTailorsQueryParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface BackendDesignResponse {
  id: number;
  shop_id: number;
  shop_name?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  title: string;
  description?: string | null;
  price_from: number;
  price_to?: number | null;
  fabric?: string | null;
  customization_available: boolean;
  is_active: boolean;
  image_url?: string | null;
  tags?: string | null;
}

export interface MarketplaceSearchResponse {
  query: string;
  total_tailors: number;
  total_designs: number;
  tailors: NearbyTailor[];
  designs: BackendDesignResponse[];
}

export interface MarketplaceSearchParams {
  q?: string;
  category?: string;
  city?: string;
  sort_by?: 'rating' | 'experience' | 'price';
}

export const tailorDiscoveryService = {
  /**
   * Search registered tailor ateliers nearby the customer coordinates
   */
  async getNearbyTailors(params: NearbyTailorsQueryParams): Promise<NearbyTailor[]> {
    const searchParams = new URLSearchParams({
      latitude: String(params.latitude),
      longitude: String(params.longitude),
    });
    if (params.radius !== undefined) {
      searchParams.append('radius', String(params.radius));
    }
    return apiClient<NearbyTailor[]>(`/tailors/nearby?${searchParams.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * Fullstack search across both Tailors and Bespoke Designs
   */
  async searchMarketplace(params: MarketplaceSearchParams): Promise<MarketplaceSearchResponse> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.category && params.category !== 'All') searchParams.append('category', params.category);
    if (params.city && params.city !== 'All') searchParams.append('city', params.city);
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);

    try {
      const res = await apiClient<MarketplaceSearchResponse>(`/tailors/search?${searchParams.toString()}`, {
        method: 'GET',
      });
      if (res && (res.tailors.length > 0 || res.designs.length > 0 || !params.q)) {
        // Merge client-published custom designs from localStorage if matching
        try {
          const customStr = localStorage.getItem('threadcraft_custom_designs');
          if (customStr) {
            const custom = JSON.parse(customStr);
            if (Array.isArray(custom) && custom.length > 0) {
              const q = (params.q || '').trim().toLowerCase();
              const existingTitles = new Set(res.designs.map((d) => d.title.toLowerCase()));
              const matchingCustom = custom.filter((cd: any) => {
                if (!cd || !cd.title) return false;
                if (existingTitles.has(cd.title.toLowerCase())) return false;
                if (!q) return true;
                const titleMatch = cd.title.toLowerCase().includes(q);
                const tagsStr = Array.isArray(cd.tags) ? cd.tags.join(' ') : (cd.tags || '');
                const tagsMatch = tagsStr.toLowerCase().includes(q);
                const descMatch = (cd.description || '').toLowerCase().includes(q);
                return titleMatch || tagsMatch || descMatch;
              }).map((cd: any, idx: number) => ({
                id: typeof cd.id === 'string' ? parseInt(cd.id.replace('design-', ''), 10) || (9000 + idx) : Number(cd.id),
                shop_id: 1,
                shop_name: cd.tailorName || 'Royal Zari Heritage Studio',
                category_name: cd.category || 'Bespoke Garment',
                title: cd.title,
                description: cd.description || 'Custom crafted bespoke garment.',
                price_from: cd.priceEstimate || 185,
                price_to: (cd.priceEstimate || 185) * 1.3,
                fabric: Array.isArray(cd.fabricOptions) ? cd.fabricOptions.join(', ') : (cd.fabric || 'Tussar Raw Silk'),
                customization_available: true,
                is_active: true,
                image_url: cd.image || cd.image_url || '/designs/ladies-kurta-formal-dress.jpg',
                tags: Array.isArray(cd.tags) ? cd.tags.join(', ') : (cd.tags || ''),
              }));
              if (matchingCustom.length > 0) {
                res.designs = [...matchingCustom, ...res.designs];
                res.total_designs = res.designs.length;
              }
            }
          }
        } catch (storageErr) {
          console.warn('Could not read custom designs from localStorage:', storageErr);
        }
        return res;
      }
    } catch (err) {
      console.warn('Backend search API unreachable or returned error, falling back to local sartorial index:', err);
    }

    // High-performance intelligent local fallback matching
    const q = (params.q || '').trim().toLowerCase();
    const tokens = q.split(/\s+/).filter((t) => t.length > 1);

    // Merge mock designs with custom stored designs
    let combinedDesigns = [...mockDesigns];
    try {
      const customStr = localStorage.getItem('threadcraft_custom_designs');
      if (customStr) {
        const custom = JSON.parse(customStr);
        if (Array.isArray(custom) && custom.length > 0) {
          const customIds = new Set(custom.map((d: any) => String(d.id)));
          combinedDesigns = [...custom, ...mockDesigns.filter((d) => !customIds.has(String(d.id)))];
        }
      }
    } catch (e) {
      console.warn('Failed loading custom designs in search fallback:', e);
    }

    // Filter local designs
    const matchedDesigns = combinedDesigns.filter((d) => {
      if (!q) return true;
      const titleMatch = d.title.toLowerCase().includes(q) || tokens.some((t) => d.title.toLowerCase().includes(t));
      const tagsArray = Array.isArray(d.tags) ? d.tags : typeof d.tags === 'string' ? d.tags.split(',') : [];
      const tagsMatch = tagsArray.some((tag: string) => tag.toLowerCase().includes(q) || tokens.some((t) => tag.toLowerCase().includes(t)));
      const descMatch = d.description?.toLowerCase().includes(q);
      const fabricMatch = d.fabricOptions?.some((f) => f.toLowerCase().includes(q));
      const tailorMatch = d.tailorName?.toLowerCase().includes(q);
      const categoryMatch = d.category?.toLowerCase().includes(q);
      return titleMatch || tagsMatch || descMatch || fabricMatch || tailorMatch || categoryMatch;
    });

    // Filter local tailors
    const matchedTailors = mockTailors.filter((t) => {
      if (!q) return true;
      const nameMatch = t.name.toLowerCase().includes(q) || t.shopName.toLowerCase().includes(q);
      const cityMatch = t.location.city.toLowerCase().includes(q);
      const specMatch = t.specialties.some((s) => s.toLowerCase().includes(q) || tokens.some((tok) => s.toLowerCase().includes(tok)));
      const bioMatch = t.bio?.toLowerCase().includes(q) || tokens.some((tok) => t.bio?.toLowerCase().includes(tok));
      const designsMatch = matchedDesigns.some((d) => d.tailorId === t.id || d.tailorName === t.shopName);
      return nameMatch || cityMatch || specMatch || bioMatch || designsMatch;
    });

    // Map mockTailors to NearbyTailor shape
    const tailorsList: NearbyTailor[] = matchedTailors.map((t, idx) => ({
      shop_id: parseInt(t.id.replace('tailor-', ''), 10) || idx + 1,
      shop_name: t.shopName,
      shop_address: t.location.area || t.location.city,
      city: t.location.city,
      state: 'Greater London',
      country: 'United Kingdom',
      latitude: 51.5074,
      longitude: -0.1278,
      distance: t.location.distanceKm || 1.5,
      rating: t.rating,
      review_count: t.reviewCount,
      profile_image: t.avatar,
      cover_image: t.coverImage,
      specialties: t.specialties,
      starting_price: t.startingPrice,
      turnaround_days: t.turnaroundDays,
      phone: '+44 20 7946 0888',
      owner_name: t.name,
      is_active: true,
    }));

    // Map mockDesigns to BackendDesignResponse shape
    const designsList: BackendDesignResponse[] = matchedDesigns.map((d, idx) => ({
      id: typeof d.id === 'string' ? parseInt(d.id.replace('design-', ''), 10) || idx + 1 : Number(d.id),
      shop_id: 1,
      shop_name: d.tailorName,
      category_name: d.category,
      title: d.title,
      description: d.description,
      price_from: d.price_from ?? d.priceEstimate ?? 150,
      price_to: d.price_to ?? (d.priceEstimate ? d.priceEstimate * 1.4 : 200),
      fabric: d.fabric || d.fabricOptions?.[0] || 'Bespoke Silk',
      customization_available: true,
      is_active: true,
      image_url: d.image || d.image_url,
      tags: Array.isArray(d.tags) ? d.tags.join(', ') : d.tags || '',
    }));

    return {
      query: params.q || '',
      total_tailors: tailorsList.length,
      total_designs: designsList.length,
      tailors: tailorsList,
      designs: designsList,
    };
  },
};

