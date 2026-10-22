export interface Design {
  id: string | number;
  shop_id?: number;
  shop_name?: string;
  category_id?: number;
  category_name?: string;
  title: string;
  category: 'Men Suits' | 'Women Couture' | 'Traditional' | 'Alterations' | 'Formal Wear' | string;
  tailorId?: string;
  tailorName?: string;
  image?: string;
  image_url?: string;
  video?: string;
  video_url?: string;
  images?: string[];
  priceEstimate?: number;
  price_from?: number;
  price_to?: number;
  fabric?: string;
  tags?: string[] | string;
  fabricOptions?: string[];
  description?: string;
  likes?: number;
  customization_available?: boolean;
  is_active?: boolean;
}
