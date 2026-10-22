export interface ServiceOffering {
  id: string;
  title: string;
  shortDesc: string;
  detailedDesc: string;
  iconName: string;
  priceFrom: number;
  estimatedTimeline: string;
  features: string[];
  image: string;
}

export const mockServices: ServiceOffering[] = [
  {
    id: 'srv-1',
    title: 'Custom Suits & Shirts',
    shortDesc: 'Custom tailored suits, blazers, and shirts made to your exact measurements.',
    detailedDesc: 'Get the perfect fit for office or celebrations. Every suit and shirt is cut to your unique body measurements for total comfort.',
    iconName: 'Scissors',
    priceFrom: 299,
    estimatedTimeline: '2 to 3 weeks',
    features: ['Custom fitting to your size', 'Premium stitching quality', 'Durable buttons & lining', 'Free fitting trial included'],
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'srv-2',
    title: 'Ladies Blouses & Bridal Maggam Stitching',
    shortDesc: 'Custom bridal saree blouses, Aari maggam hand embroidery, princess cut, and party wear.',
    detailedDesc: 'Expert tailoring for wedding saree blouses, silk crop tops, and ethnic party wear. Our master tailors specialize in aari maggam needlework, zardozi embroidery, padded cups, and perfect neckline fit.',
    iconName: 'Sparkles',
    priceFrom: 85,
    estimatedTimeline: '5 to 10 days',
    features: ['Custom neckline & back dori latkans', 'Aari & Maggam hand embroidery', 'Princess cut & padded bust fit', 'Piped finishing & free fitting trial'],
    image: '/blouses/blush-pink-sweetheart-blouse.jpg',
  },
  {
    id: 'srv-3',
    title: 'Alterations & Fitting Repairs',
    shortDesc: 'Quick resizing, waist adjustments, shortening, and fitting repairs for clothes.',
    detailedDesc: 'Make your existing clothes fit like new. From shortening pants to tightening shirts and fixing zippers.',
    iconName: 'Ruler',
    priceFrom: 45,
    estimatedTimeline: '3 to 5 days',
    features: ['Length shortening', 'Waist tightening & loosening', 'Sleeve length adjustments', 'Quick turnaround available'],
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'srv-4',
    title: 'Traditional & Festive Wear',
    shortDesc: 'Kurtas, Sherwanis, ethnic sets, and festival attire stitched to perfection.',
    detailedDesc: 'Traditional tailoring for festivals and family celebrations. Comfortable fabrics and authentic styling.',
    iconName: 'Crown',
    priceFrom: 350,
    estimatedTimeline: '2 to 4 weeks',
    features: ['Pure silk & cotton fabrics', 'Fine collar & cuff stitching', 'Matching accessories', 'Comfortable traditional fit'],
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'srv-5',
    title: 'Doorstep Tailor Measurement',
    shortDesc: 'A local tailor visits your home or office to take accurate measurements.',
    detailedDesc: 'Save time traveling. A verified tailor comes to your doorstep with measurement tapes and fabric samples.',
    iconName: 'MapPin',
    priceFrom: 50,
    estimatedTimeline: 'Slots within 24h',
    features: ['Fabric samples to see in person', 'Accurate body measurements', 'Personal styling advice', 'Convenient weekend slots'],
    image: '/designs/woman-taking-measurements.jpg',
  },
  {
    id: 'srv-6',
    title: 'Quality Fabric Selection & Hand Shearing',
    shortDesc: 'Choose from top quality cotton, linen, silk, and wool fabrics cut by master tailors.',
    detailedDesc: 'Select the right cloth for your outfits. We source breathable, long-lasting fabrics directly from top textile mills and hand-cut each yard with tailor shears.',
    iconName: 'Layers',
    priceFrom: 80,
    estimatedTimeline: 'Immediate dispatch',
    features: ['100% genuine fabrics', 'Pure wool, cotton & breathable linen', 'Bespoke hand-sheared cloth', 'Free fabric swatches'],
    image: '/designs/tailor-cutting-cloth.jpg',
  },
];
