export const mockCustomerStats = {
  activeOrders: 2,
  completedGarments: 7,
  savedMeasurements: 3,
  favoriteTailors: 4,
};

export const mockTailorStats = {
  monthlyRevenue: 14850,
  activeProjects: 12,
  pendingMeasurements: 5,
  atelierRating: 4.94,
  completionRate: '98.5%',
  totalCustomers: 184,
};

export const mockAdminStats = {
  totalPlatformVolume: 128450,
  activeTailors: 48,
  pendingApprovals: 6,
  totalCustomers: 1420,
  platformCommission: 12845,
  systemUptime: '99.98%',
};

export const mockCustomerProfile = {
  name: 'Lord Alexander Hayes',
  email: 'alexander.hayes@mayfair.co.uk',
  phone: '+44 20 7946 0912',
  location: 'Mayfair, London, UK',
  defaultMeasurementUnit: 'cm',
  measurements: {
    chest: 104,
    waist: 86,
    hips: 100,
    shoulderWidth: 47,
    sleeveLength: 64,
    neck: 41,
    inseam: 82,
    outseam: 106,
  },
  savedAddresses: [
    { label: 'Primary Residence', address: '14 Berkeley Square, Mayfair, London W1J 6BL' },
    { label: 'Office Atelier', address: '88 St James’s St, St. James’s, London SW1A 1PL' },
  ]
};
