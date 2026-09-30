import { PrismaClient, UserRole, BusinessType, BusinessVerificationStatus, OrderStatus, PaymentMethod, PaymentStatus, AppointmentType, AppointmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding TailorConnect Database ---');

  // 1. Clean existing records in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.orderNote.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.requestMessage.deleteMany();
  await prisma.requestImage.deleteMany();
  await prisma.customerRequest.deleteMany();
  await prisma.businessPortfolio.deleteMany();
  await prisma.businessSpecialization.deleteMany();
  await prisma.businessService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.businessLocation.deleteMany();
  await prisma.businessMember.deleteMany();
  await prisma.business.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.adminAction.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 2. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@tailorconnect.com',
      phone: '9999900000',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Administrator',
          city: 'Hyderabad',
          state: 'Telangana',
        },
      },
      preferences: { create: {} },
    },
  });
  console.log('✓ Admin user seeded (admin@tailorconnect.com / Password123!)');

  // 3. Create Service Categories & Services
  const catWomens = await prisma.serviceCategory.create({
    data: {
      name: "Women's Wear",
      slug: 'womens-wear',
      description: 'Custom blouses, lehengas, kurtis, salwar suits, and alterations',
      iconName: 'Sparkles',
      displayOrder: 1,
    },
  });

  const catMens = await prisma.serviceCategory.create({
    data: {
      name: "Men's Wear",
      slug: 'mens-wear',
      description: 'Bespoke shirts, trousers, suits, sherwanis, and formal wear',
      iconName: 'Shirt',
      displayOrder: 2,
    },
  });

  const catKids = await prisma.serviceCategory.create({
    data: {
      name: 'Kids Wear',
      slug: 'kids-wear',
      description: 'Traditional dresses, festive wear, and uniforms for children',
      iconName: 'Baby',
      displayOrder: 3,
    },
  });

  const catSpecialty = await prisma.serviceCategory.create({
    data: {
      name: 'Specialty & Designer',
      slug: 'specialty',
      description: 'Bridal zardosi embroidery, couture alterations, and designer garments',
      iconName: 'Gem',
      displayOrder: 4,
    },
  });

  // Services
  const serviceBlouse = await prisma.service.create({
    data: {
      categoryId: catWomens.id,
      name: 'Blouse Stitching',
      slug: 'blouse-stitching',
      gender: 'WOMEN',
      description: 'Custom fitting blouse with lining, piping, and neck design',
      benchmarkStartingPrice: 650.00,
      typicalTurnaroundDays: 4,
    },
  });

  const serviceBridalBlouse = await prisma.service.create({
    data: {
      categoryId: catWomens.id,
      name: 'Bridal Blouse with Embroidery',
      slug: 'bridal-blouse',
      gender: 'WOMEN',
      description: 'Intricate zardosi, maggam work, cutwork, and padded bridal blouses',
      benchmarkStartingPrice: 1800.00,
      typicalTurnaroundDays: 7,
    },
  });

  const serviceLehenga = await prisma.service.create({
    data: {
      categoryId: catWomens.id,
      name: 'Lehenga & Choli',
      slug: 'lehenga-choli',
      gender: 'WOMEN',
      description: 'Multi-kali lehengas, can-can layering, and designer dupattas',
      benchmarkStartingPrice: 2500.00,
      typicalTurnaroundDays: 10,
    },
  });

  const serviceKurti = await prisma.service.create({
    data: {
      categoryId: catWomens.id,
      name: 'Kurti / Salwar Suit',
      slug: 'kurti-salwar',
      gender: 'WOMEN',
      description: 'Straight cut, Anarkali, or A-line kurtis with tailored bottoms',
      benchmarkStartingPrice: 750.00,
      typicalTurnaroundDays: 4,
    },
  });

  const serviceMenShirt = await prisma.service.create({
    data: {
      categoryId: catMens.id,
      name: 'Custom Tailored Shirt',
      slug: 'mens-shirt',
      gender: 'MEN',
      description: 'Perfect collar fit, French cuffs, and customized fit shirts',
      benchmarkStartingPrice: 600.00,
      typicalTurnaroundDays: 4,
    },
  });

  const serviceMenSuit = await prisma.service.create({
    data: {
      categoryId: catMens.id,
      name: 'Two-Piece Bespoke Suit',
      slug: 'mens-suit',
      gender: 'MEN',
      description: 'Hand-canvassed formal suit with trousers',
      benchmarkStartingPrice: 5500.00,
      typicalTurnaroundDays: 12,
    },
  });

  const serviceSherwani = await prisma.service.create({
    data: {
      categoryId: catMens.id,
      name: 'Wedding Sherwani',
      slug: 'wedding-sherwani',
      gender: 'MEN',
      description: 'Royal regal sherwanis with churidar and pocket detail',
      benchmarkStartingPrice: 6500.00,
      typicalTurnaroundDays: 14,
    },
  });

  console.log('✓ Service taxonomy seeded');

  // 4. Create Tailor & Boutique Businesses
  // 4.1 Meera Boutique (Boutique, Banjara Hills)
  const meeraUser = await prisma.user.create({
    data: {
      email: 'meera@meeraboutique.com',
      phone: '9848011223',
      passwordHash: defaultPasswordHash,
      role: UserRole.BUSINESS,
      profile: {
        create: {
          firstName: 'Meera',
          lastName: 'Reddy',
          city: 'Hyderabad',
          state: 'Telangana',
          approxLocation: 'Banjara Hills',
        },
      },
      preferences: { create: {} },
    },
  });

  const meeraBoutique = await prisma.business.create({
    data: {
      name: 'Meera Boutique',
      slug: 'meera-boutique',
      businessType: BusinessType.BOUTIQUE,
      verificationStatus: BusinessVerificationStatus.VERIFIED,
      description: 'Premier couture boutique in Banjara Hills specializing in bridal blouses, hand zardosi embroidery, and designer festive lehengas. Over 15 years of bespoke craftsmanship.',
      coverImageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop',
      logoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
      phone: '9848011223',
      email: 'meera@meeraboutique.com',
      typicalTurnaroundDays: 5,
      startingPrice: 1200.00,
      serviceRadiusKm: 20.0,
      offersHomePickup: true,
      offersHomeDelivery: true,
      offersHomeMeasurement: true,
      requiresAppointment: true,
      ratingAverage: 4.90,
      totalReviewsCount: 128,
      completedOrdersCount: 240,
      workingHours: {
        mon: { open: '10:00', close: '20:00' },
        tue: { open: '10:00', close: '20:00' },
        wed: { open: '10:00', close: '20:00' },
        thu: { open: '10:00', close: '20:00' },
        fri: { open: '10:00', close: '20:00' },
        sat: { open: '10:00', close: '21:00' },
        sun: { open: '11:00', close: '18:00' },
      },
      languagesSpoken: ['English', 'Telugu', 'Hindi'],
      location: {
        create: {
          addressLine1: 'Road No. 10, Banjara Hills',
          locality: 'Banjara Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500034',
          latitude: 17.4156,
          longitude: 78.4350,
        },
      },
      members: {
        create: {
          userId: meeraUser.id,
          role: 'OWNER',
        },
      },
      specializations: {
        createMany: {
          data: [
            { tag: 'Bridal Blouse' },
            { tag: 'Maggam Work' },
            { tag: 'Zardosi Embroidery' },
            { tag: 'Designer Lehengas' },
            { tag: 'Padded Blouses' },
          ],
        },
      },
      services: {
        createMany: {
          data: [
            { serviceId: serviceBridalBlouse.id, basePrice: 1600.00, estimatedDays: 5 },
            { serviceId: serviceBlouse.id, basePrice: 850.00, estimatedDays: 3 },
            { serviceId: serviceLehenga.id, basePrice: 3200.00, estimatedDays: 8 },
            { serviceId: serviceKurti.id, basePrice: 950.00, estimatedDays: 4 },
          ],
        },
      },
      portfolioItems: {
        createMany: {
          data: [
            {
              title: 'Gold Zardosi Bridal Blouse with Pearl Tassels',
              category: 'Bridal',
              garmentType: 'Blouse',
              imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop',
              description: 'Intricate hand zardosi on raw silk with elbow sleeve detailing.',
              displayOrder: 1,
            },
            {
              title: 'Crimson Velvet Bridal Lehenga',
              category: 'Bridal',
              garmentType: 'Lehenga',
              imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop',
              description: '16-kali kalidar lehenga with double can-can structuring.',
              displayOrder: 2,
            },
            {
              title: 'Emerald Green Padded Designer Blouse',
              category: 'Blouse',
              garmentType: 'Blouse',
              imageUrl: 'https://images.unsplash.com/photo-1596783074418-c41ab2b14644?w=800&auto=format&fit=crop',
              description: 'Boat neck pattern with back keyhole and dori work.',
              displayOrder: 3,
            },
          ],
        },
      },
    },
  });

  // 4.2 Ramesh Tailors (Individual Tailor, Madhapur)
  const rameshUser = await prisma.user.create({
    data: {
      email: 'ramesh@rameshtailors.in',
      phone: '9849022334',
      passwordHash: defaultPasswordHash,
      role: UserRole.BUSINESS,
      profile: {
        create: {
          firstName: 'Ramesh',
          lastName: 'Kumar',
          city: 'Hyderabad',
          state: 'Telangana',
          approxLocation: 'Madhapur',
        },
      },
      preferences: { create: {} },
    },
  });

  const rameshTailors = await prisma.business.create({
    data: {
      name: 'Ramesh Master Tailor & Alterations',
      slug: 'ramesh-tailors',
      businessType: BusinessType.INDIVIDUAL_TAILOR,
      verificationStatus: BusinessVerificationStatus.VERIFIED,
      description: 'Master tailor with 22 years of precision experience in Madhapur / Hitec City. Fast turnaround, precision fitting, and affordable prices.',
      coverImageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop',
      logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
      phone: '9849022334',
      email: 'ramesh@rameshtailors.in',
      typicalTurnaroundDays: 3,
      startingPrice: 450.00,
      serviceRadiusKm: 12.0,
      offersHomePickup: false,
      offersHomeDelivery: false,
      offersHomeMeasurement: true,
      requiresAppointment: false,
      ratingAverage: 4.82,
      totalReviewsCount: 210,
      completedOrdersCount: 450,
      workingHours: {
        mon: { open: '09:30', close: '21:00' },
        tue: { open: '09:30', close: '21:00' },
        wed: { open: '09:30', close: '21:00' },
        thu: { open: '09:30', close: '21:00' },
        fri: { open: '09:30', close: '21:00' },
        sat: { open: '09:30', close: '21:30' },
        sun: { open: '10:00', close: '15:00' },
      },
      languagesSpoken: ['Telugu', 'Hindi', 'English'],
      location: {
        create: {
          addressLine1: 'Near Metro Pillar C14, Madhapur Main Road',
          locality: 'Madhapur',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500081',
          latitude: 17.4485,
          longitude: 78.3908,
        },
      },
      members: {
        create: {
          userId: rameshUser.id,
          role: 'OWNER',
        },
      },
      specializations: {
        createMany: {
          data: [
            { tag: 'Quick Alterations' },
            { tag: 'Blouse Stitching' },
            { tag: 'Salwar Kameez' },
            { tag: 'Trousers & Shirts' },
          ],
        },
      },
      services: {
        createMany: {
          data: [
            { serviceId: serviceBlouse.id, basePrice: 550.00, estimatedDays: 2 },
            { serviceId: serviceKurti.id, basePrice: 650.00, estimatedDays: 3 },
            { serviceId: serviceMenShirt.id, basePrice: 500.00, estimatedDays: 3 },
          ],
        },
      },
    },
  });

  // 4.3 Royal Men's Bespoke (Kondapur)
  const royalUser = await prisma.user.create({
    data: {
      email: 'royal@mensbespoke.in',
      phone: '9849033445',
      passwordHash: defaultPasswordHash,
      role: UserRole.BUSINESS,
      profile: {
        create: {
          firstName: 'Vikram',
          lastName: 'Singh',
          city: 'Hyderabad',
          state: 'Telangana',
          approxLocation: 'Kondapur',
        },
      },
      preferences: { create: {} },
    },
  });

  const royalMens = await prisma.business.create({
    data: {
      name: "Royal Men's Bespoke Studio",
      slug: 'royal-mens-bespoke',
      businessType: BusinessType.BOUTIQUE,
      verificationStatus: BusinessVerificationStatus.VERIFIED,
      description: 'Exclusive gentlemen tailoring atelier for wedding sherwanis, bandhgalas, tuxedos, and handcrafted corporate suits.',
      coverImageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop',
      phone: '9849033445',
      email: 'royal@mensbespoke.in',
      typicalTurnaroundDays: 10,
      startingPrice: 3500.00,
      serviceRadiusKm: 25.0,
      offersHomePickup: true,
      offersHomeDelivery: true,
      offersHomeMeasurement: true,
      requiresAppointment: true,
      ratingAverage: 4.88,
      totalReviewsCount: 150,
      completedOrdersCount: 195,
      location: {
        create: {
          addressLine1: 'Opposite Botanical Gardens, Kondapur',
          locality: 'Kondapur',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500084',
          latitude: 17.4615,
          longitude: 78.3610,
        },
      },
      members: {
        create: {
          userId: royalUser.id,
          role: 'OWNER',
        },
      },
      specializations: {
        createMany: {
          data: [
            { tag: 'Wedding Sherwani' },
            { tag: 'Two-Piece Suits' },
            { tag: 'Tuxedos' },
            { tag: 'Bandhgala' },
          ],
        },
      },
      services: {
        createMany: {
          data: [
            { serviceId: serviceMenSuit.id, basePrice: 5500.00, estimatedDays: 10 },
            { serviceId: serviceSherwani.id, basePrice: 6500.00, estimatedDays: 12 },
            { serviceId: serviceMenShirt.id, basePrice: 700.00, estimatedDays: 4 },
          ],
        },
      },
    },
  });

  // 4.4 Pending Verification Business (for Admin testing)
  const pendingUser = await prisma.user.create({
    data: {
      email: 'lakshmi@designerstudio.com',
      phone: '9849044556',
      passwordHash: defaultPasswordHash,
      role: UserRole.BUSINESS,
      profile: {
        create: {
          firstName: 'Lakshmi',
          lastName: 'Prasanna',
          city: 'Hyderabad',
          state: 'Telangana',
          approxLocation: 'Jubilee Hills',
        },
      },
      preferences: { create: {} },
    },
  });

  const pendingBoutique = await prisma.business.create({
    data: {
      name: 'Lakshmi Designer Studio',
      slug: 'lakshmi-designer-studio',
      businessType: BusinessType.BOUTIQUE,
      verificationStatus: BusinessVerificationStatus.PENDING,
      description: 'Newly registered couture boutique in Jubilee Hills awaiting verification check.',
      phone: '9849044556',
      email: 'lakshmi@designerstudio.com',
      startingPrice: 1500.00,
      typicalTurnaroundDays: 6,
      serviceRadiusKm: 15.0,
      location: {
        create: {
          addressLine1: 'Road 36, Jubilee Hills',
          locality: 'Jubilee Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500033',
          latitude: 17.4319,
          longitude: 78.4073,
        },
      },
      members: {
        create: {
          userId: pendingUser.id,
          role: 'OWNER',
        },
      },
    },
  });

  console.log('✓ Tailors and Boutiques seeded');

  // 5. Create Sample Customers
  const customerPriya = await prisma.user.create({
    data: {
      email: 'priya.sharma@example.com',
      phone: '9876543210',
      passwordHash: defaultPasswordHash,
      role: UserRole.CUSTOMER,
      profile: {
        create: {
          firstName: 'Priya',
          lastName: 'Sharma',
          city: 'Hyderabad',
          state: 'Telangana',
          approxLocation: 'Madhapur',
          latitude: 17.4480,
          longitude: 78.3890,
        },
      },
      preferences: { create: {} },
    },
  });

  const customerAnanya = await prisma.user.create({
    data: {
      email: 'ananya.reddy@example.com',
      phone: '9876543211',
      passwordHash: defaultPasswordHash,
      role: UserRole.CUSTOMER,
      profile: {
        create: {
          firstName: 'Ananya',
          lastName: 'Reddy',
          city: 'Hyderabad',
          state: 'Telangana',
          approxLocation: 'Banjara Hills',
          latitude: 17.4160,
          longitude: 78.4360,
        },
      },
      preferences: { create: {} },
    },
  });

  console.log('✓ Customers seeded (priya.sharma@example.com / Password123!)');

  // 6. Create Live Stitching Request, Quote & Order Loop
  // Request 1: Priya needs a bridal blouse
  const req1 = await prisma.customerRequest.create({
    data: {
      requestNumber: 'REQ-2026-0001',
      customerId: customerPriya.id,
      serviceId: serviceBridalBlouse.id,
      garmentType: 'Bridal Blouse',
      categoryName: 'Bridal',
      rawPrompt: "I need a bridal blouse for my sister's wedding. I have the raw silk fabric. I want elbow sleeves, heavy embroidery and need it by next Friday.",
      structuredRequirements: {
        garmentType: 'blouse',
        category: 'bridal',
        occasion: 'wedding',
        sleeveStyle: 'elbow',
        embroidery: true,
        fabricProvidedByCustomer: true,
        urgency: 'high',
        requirements: ['heavy zardosi embroidery', 'elbow sleeves', 'padded cups'],
      },
      fabricProvidedByCustomer: true,
      requiredDate: new Date('2026-10-07'),
      budgetMin: 1500.00,
      budgetMax: 2200.00,
      pickupRequired: true,
      deliveryRequired: true,
      locationCity: 'Hyderabad',
      locationLocality: 'Madhapur',
      latitude: 17.4480,
      longitude: 78.3890,
      status: 'ACCEPTED',
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop', caption: 'Inspiration sleeve design' },
        ],
      },
      messages: {
        create: [
          {
            senderId: meeraUser.id,
            senderRole: UserRole.BUSINESS,
            content: 'Hello Priya! We can certainly deliver by Oct 7. Does the silk have pre-stitched border or should we provide matching piping?',
          },
          {
            senderId: customerPriya.id,
            senderRole: UserRole.CUSTOMER,
            content: 'Hi Meera! Yes, it has gold border, but please add matching red piping and padding.',
          },
        ],
      },
    },
  });

  // Quote from Meera Boutique for Request 1
  const quote1 = await prisma.quote.create({
    data: {
      quoteNumber: 'QUO-2026-0001',
      requestId: req1.id,
      businessId: meeraBoutique.id,
      status: 'ACCEPTED',
      totalAmount: 1700.00,
      advanceAmount: 500.00,
      estimatedReadyDate: new Date('2026-10-07'),
      fittingsIncluded: 1,
      notes: 'Includes padded cups, gold piping, and elbow length zardosi detailing.',
      validUntil: new Date('2026-10-05'),
      items: {
        create: [
          { title: 'Blouse Stitching & Pattern Cutting', amount: 1200.00 },
          { title: 'Zardosi & Maggam Hand Embroidery', amount: 400.00 },
          { title: 'Padded Cups & Gold Piping', amount: 100.00 },
        ],
      },
    },
  });

  // Active Order created from Quote 1
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'TC-2026-000001',
      customerId: customerPriya.id,
      businessId: meeraBoutique.id,
      requestId: req1.id,
      quoteId: quote1.id,
      garmentName: 'Bridal Blouse with Zardosi Embroidery',
      status: OrderStatus.STITCHING,
      totalAmount: 1700.00,
      paidAmount: 500.00,
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
      estimatedCompletion: new Date('2026-10-07'),
      deliveryOption: 'PICKUP',
      customerNotes: 'Customer fabric delivered at studio. First trial scheduled.',
      statusHistory: {
        create: [
          { fromStatus: null, toStatus: OrderStatus.ACCEPTED, changedById: customerPriya.id, note: 'Quote accepted by customer with advance payment.' },
          { fromStatus: OrderStatus.ACCEPTED, toStatus: OrderStatus.MEASUREMENT, changedById: meeraUser.id, note: 'In-store measurements completed and verified.' },
          { fromStatus: OrderStatus.MEASUREMENT, toStatus: OrderStatus.CUTTING, changedById: meeraUser.id, note: 'Raw silk cut to pattern, lining layered.' },
          { fromStatus: OrderStatus.CUTTING, toStatus: OrderStatus.STITCHING, changedById: meeraUser.id, note: 'Embroidery finished, main blouse assembly in progress.' },
        ],
      },
      appointments: {
        create: {
          appointmentNumber: 'APT-2026-0001',
          customerId: customerPriya.id,
          businessId: meeraBoutique.id,
          type: AppointmentType.FITTING,
          status: AppointmentStatus.CONFIRMED,
          date: new Date('2026-10-05'),
          startTime: '16:00',
          endTime: '16:30',
          notes: 'First trial for sleeve length and back fit.',
        },
      },
      payments: {
        create: {
          paymentNumber: 'PAY-2026-0001',
          amount: 500.00,
          method: PaymentMethod.OFFLINE_UPI_QR,
          status: PaymentStatus.PAID,
          notes: 'Advance payment received via UPI QR',
          paidAt: new Date(),
          transactions: {
            create: {
              transactionRef: 'UPI-TXN-20260930-01',
              amount: 500.00,
              gatewayName: 'OFFLINE_UPI',
              status: PaymentStatus.PAID,
            },
          },
        },
      },
      notes: {
        create: [
          { authorId: meeraUser.id, content: 'Front neckline: deep sweetheart. Sleeves: 11 inches.', isCustomerVisible: true },
        ],
      },
    },
  });

  // Request 2: Ananya Reddy has submitted a request awaiting quotes
  await prisma.customerRequest.create({
    data: {
      requestNumber: 'REQ-2026-0002',
      customerId: customerAnanya.id,
      serviceId: serviceKurti.id,
      garmentType: 'Anarkali Kurti Suit',
      categoryName: "Women's Wear",
      rawPrompt: 'Looking for a floral Anarkali suit stitching with cotton dupatta. Ready to provide fabric.',
      structuredRequirements: {
        garmentType: 'kurti',
        category: 'anarkali',
        fabricProvidedByCustomer: true,
        urgency: 'normal',
      },
      fabricProvidedByCustomer: true,
      requiredDate: new Date('2026-10-14'),
      budgetMin: 800.00,
      budgetMax: 1200.00,
      locationCity: 'Hyderabad',
      locationLocality: 'Banjara Hills',
      latitude: 17.4160,
      longitude: 78.4360,
      status: 'SUBMITTED',
    },
  });

  // Quote 2 for Ananya's previous completed order
  const quotePast = await prisma.quote.create({
    data: {
      quoteNumber: 'QUO-2026-0000',
      requestId: req1.id, // can link to request or create new
      businessId: meeraBoutique.id,
      status: 'ACCEPTED',
      totalAmount: 1400.00,
      advanceAmount: 1400.00,
      estimatedReadyDate: new Date('2026-09-20'),
      fittingsIncluded: 1,
      notes: 'Completed festive blouse order',
      validUntil: new Date('2026-09-15'),
      items: {
        create: [
          { title: 'Banarasi Silk Blouse Stitching', amount: 1000.00 },
          { title: 'Neck & Sleeve Border Detailing', amount: 400.00 },
        ],
      },
    },
  });

  // Sample Completed Order with Review
  const orderCompleted = await prisma.order.create({
    data: {
      orderNumber: 'TC-2026-000000',
      customerId: customerAnanya.id,
      businessId: meeraBoutique.id,
      quoteId: quotePast.id,
      garmentName: 'Festive Banarasi Silk Blouse',
      status: OrderStatus.COMPLETED,
      totalAmount: 1400.00,
      paidAmount: 1400.00,
      paymentStatus: PaymentStatus.PAID,
      estimatedCompletion: new Date('2026-09-20'),
      deliveryOption: 'PICKUP',
      review: {
        create: {
          customerId: customerAnanya.id,
          businessId: meeraBoutique.id,
          rating: 5,
          serviceType: 'Blouse Stitching',
          comment: 'Outstanding fit! Meera and her team finished the intricate zardosi border perfectly on time. Highly recommend for bridal work.',
          fitRating: 5,
          finishingRating: 5,
        },
      },
    },
  });

  // Sample Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: customerPriya.id,
        title: 'Order Status Updated: Stitching',
        body: 'Meera Boutique has begun assembly of your Bridal Blouse. Trial date: Oct 5.',
        linkUrl: `/app/orders/${order1.id}`,
        isRead: false,
      },
      {
        userId: meeraUser.id,
        title: 'New Stitching Request Nearby',
        body: 'Ananya Reddy submitted an Anarkali Kurti request in Banjara Hills (0.8 km away).',
        linkUrl: '/tailor/requests',
        isRead: false,
      },
    ],
  });

  console.log('✓ Sample requests, quotes, orders, timeline, and reviews seeded successfully!');
  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
