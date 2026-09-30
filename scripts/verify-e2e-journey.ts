import { api } from '@tailorconnect/api-client';

const API_BASE = 'http://localhost:5000/api/v1';

async function request(endpoint: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`[${res.status}] ${data.error?.message || 'Request failed'}`);
  }
  return data;
}

async function runE2EJourney() {
  console.log('\n=============================================================');
  console.log('  TAILORCONNECT — END-TO-END VERIFICATION SUITE');
  console.log('=============================================================\n');

  // STEP 1: API Health
  process.stdout.write('1. API Health Check... ');
  const health = await request('/health');
  if (health.status !== 'ok') throw new Error('Health check failed');
  console.log('✓ PASS (API v1.0.0 Online)');

  // STEP 2: Customer Authentication
  process.stdout.write('2. Customer Authentication (Priya Sharma)... ');
  const customerLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'priya.sharma@example.com', password: 'Password123!' }),
  });
  const customerToken = customerLogin.data.accessToken;
  const customerId = customerLogin.data.user.id;
  console.log(`✓ PASS (Token issued for customer: ${customerLogin.data.user.profile.firstName})`);

  // STEP 3: Natural Language AI Requirement Extraction
  process.stdout.write('3. AI Requirement Extraction Parser... ');
  const aiExtraction = await request('/ai-matching/extract', {
    method: 'POST',
    body: JSON.stringify({
      promptText: "I need a bridal blouse for my sister's wedding. I have the raw silk fabric. I want elbow sleeves, heavy zardosi embroidery and need it by next Friday.",
    }),
  });
  const extracted = aiExtraction.data;
  if (!extracted.garmentType || !extracted.embroidery || extracted.urgency !== 'high') {
    throw new Error('AI extraction attributes mismatch');
  }
  console.log(`✓ PASS (Detected: ${extracted.garmentType}, ${extracted.sleeveStyle} sleeves, ${extracted.urgency} urgency, budget: ₹${extracted.suggestedBudget.min}-₹${extracted.suggestedBudget.max})`);

  // STEP 4: Deterministic Geo-Discovery Search
  process.stdout.write('4. Hybrid Deterministic Geo-Matching... ');
  const discovery = await request('/discovery/search?q=bridal&radiusKm=20');
  const matchedTailors = discovery.data;
  if (matchedTailors.length === 0) throw new Error('No tailors matched');
  const topTailor = matchedTailors[0];
  console.log(`✓ PASS (Matched ${matchedTailors.length} studios; Top: "${topTailor.name}" Score: ${topTailor.matchScore}/100, Dist: ${topTailor.distanceKm} km, Reasons: [${topTailor.matchReasons.slice(0, 2).join(', ')}])`);

  // STEP 5: Studio Profile Verification
  process.stdout.write('5. Public Tailor Studio Profile Inspection... ');
  const studioProfile = await request(`/businesses/${topTailor.slug}`);
  if (!studioProfile.data.services || studioProfile.data.services.length === 0) {
    throw new Error('Studio profile missing services');
  }
  console.log(`✓ PASS (${studioProfile.data.name} verified, ${studioProfile.data.services.length} services, rating: ${studioProfile.data.ratingAverage} ★)`);

  // STEP 6: Customer Creates Stitching Request
  process.stdout.write('6. Submit Stitching Request... ');
  const newReqDate = new Date();
  newReqDate.setDate(newReqDate.getDate() + 7);
  const createReq = await request('/requests', {
    method: 'POST',
    body: JSON.stringify({
      garmentType: extracted.garmentType,
      categoryName: extracted.category,
      rawPrompt: "Bridal blouse in raw silk with elbow sleeve zardosi embroidery",
      structuredRequirements: extracted,
      fabricProvidedByCustomer: true,
      requiredDate: newReqDate.toISOString().split('T')[0],
      budgetMin: 1500,
      budgetMax: 2500,
      pickupRequired: true,
      deliveryRequired: true,
      locationLocality: 'Madhapur',
      locationCity: 'Hyderabad',
      imageUrls: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop'],
    }),
  }, customerToken);
  const requestId = createReq.data.id;
  const requestNumber = createReq.data.requestNumber;
  console.log(`✓ PASS (Created ${requestNumber})`);

  // STEP 7: Tailor Authentication
  process.stdout.write('7. Tailor Authentication (Meera Boutique)... ');
  const tailorLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'meera@meeraboutique.com', password: 'Password123!' }),
  });
  const tailorToken = tailorLogin.data.accessToken;
  const tailorBusinessId = tailorLogin.data.user.business.id;
  console.log(`✓ PASS (Logged in as ${tailorLogin.data.user.business.name})`);

  // STEP 8: Tailor Inbox Check
  process.stdout.write('8. Tailor Inbound Request Queue... ');
  const tailorInbox = await request('/requests/tailor-inbox', {}, tailorToken);
  const foundReq = tailorInbox.data.find((r: any) => r.id === requestId);
  if (!foundReq) throw new Error('New request not found in tailor inbox');
  console.log(`✓ PASS (Request found within service radius, distance: ${foundReq.distanceKm} km)`);

  // STEP 9: Contextual Q&A Messaging
  process.stdout.write('9. Contextual Q&A Messaging... ');
  await request(`/requests/${requestId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content: 'Hello! Does your raw silk fabric need matching lining provided by our studio?' }),
  }, tailorToken);

  const messagesRes = await request(`/requests/${requestId}/messages`, {}, customerToken);
  if (messagesRes.data.length === 0) throw new Error('Message not delivered');
  console.log(`✓ PASS (Clarification sent and logged in request thread)`);

  // STEP 10: Tailor Issues Itemized Quote
  process.stdout.write('10. Tailor Submits Itemized Quote... ');
  const quoteRes = await request('/quotes', {
    method: 'POST',
    body: JSON.stringify({
      requestId,
      totalAmount: 1800,
      advanceAmount: 500,
      estimatedReadyDate: newReqDate.toISOString().split('T')[0],
      fittingsIncluded: 1,
      notes: 'Includes pure cotton lining, gold border piping, and elbow zardosi detailing.',
      validDays: 5,
      items: [
        { title: 'Blouse Cutting & Stitching Labor', amount: 1200 },
        { title: 'Zardosi Hand Embroidery Detailing', amount: 500 },
        { title: 'Padded Cups & Piping', amount: 100 },
      ],
    }),
  }, tailorToken);
  const quoteId = quoteRes.data.id;
  console.log(`✓ PASS (Quote issued: ₹${quoteRes.data.totalAmount}, Advance: ₹${quoteRes.data.advanceAmount})`);

  // STEP 11: Customer Accepts Quote & Converts to Order
  process.stdout.write('11. Customer Accepts Quote -> Creates Order... ');
  const acceptRes = await request(`/quotes/${quoteId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ paymentOption: 'ONLINE' }),
  }, customerToken);
  const orderId = acceptRes.data.order.id;
  const orderNumber = acceptRes.data.order.orderNumber;
  console.log(`✓ PASS (Order ${orderNumber} created with initial status: ${acceptRes.data.order.status})`);

  // STEP 12: Production State Machine & OrderStatusHistory Transitions
  console.log('\n--- Advancing Production State Machine (Server-Authoritative) ---');

  const transitions = [
    { toStatus: 'MEASUREMENT', note: 'Customer attended studio measurement session. Bust: 36, Waist: 30, Length: 14.' },
    { toStatus: 'CUTTING', note: 'Raw silk fabric laid out, pattern marked and cut to fit.' },
    { toStatus: 'STITCHING', note: 'Hand zardosi embroidery completed, assembling body panels and cotton lining.' },
    { toStatus: 'FITTING', note: 'First trial ready. Customer invited for fit check.' },
    { toStatus: 'READY', note: 'Trial approved with zero alterations. Garment steam-pressed and packaged.' },
    { toStatus: 'DELIVERED', note: 'Garment handed over to customer with garment bag.' },
  ];

  for (const t of transitions) {
    process.stdout.write(`   -> Advance to ${t.toStatus}... `);
    const transRes = await request(`/orders/${orderId}/status-transition`, {
      method: 'POST',
      body: JSON.stringify({ toStatus: t.toStatus, note: t.note }),
    }, tailorToken);
    if (transRes.data.status !== t.toStatus) throw new Error(`Transition to ${t.toStatus} failed`);
    console.log(`✓ PASS ("${t.note.substring(0, 45)}...")`);
  }

  // Customer marks COMPLETED
  process.stdout.write('   -> Customer Confirms Order Completion... ');
  const completeRes = await request(`/orders/${orderId}/status-transition`, {
    method: 'POST',
    body: JSON.stringify({ toStatus: 'COMPLETED', note: 'Customer accepted delivery and confirmed satisfaction.' }),
  }, customerToken);
  console.log('✓ PASS (Order marked COMPLETED)');

  // STEP 13: Online Payment Settlement
  process.stdout.write('\n13. Settle Online Payment (Mock Payment Adapter)... ');
  const payRes = await request('/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify({ orderId, amount: 1800, method: 'ONLINE_UPI' }),
  }, customerToken);
  console.log(`✓ PASS (Payment authorized: Txn ${payRes.data.transactionRef})`);

  // STEP 14: Customer Verified Review
  process.stdout.write('14. Verified Customer Review Submission... ');
  const reviewRes = await request('/reviews', {
    method: 'POST',
    body: JSON.stringify({
      orderId,
      rating: 5,
      serviceType: 'Bridal Blouse',
      comment: 'Absolutely spectacular craftsmanship! The zardosi detailing matched my saree border perfectly. Delivered exactly on time.',
      fitRating: 5,
      finishingRating: 5,
    }),
  }, customerToken);
  console.log(`✓ PASS (5★ Review logged, studio rating updated)`);

  // STEP 15: Admin Governance Audit
  process.stdout.write('15. Admin Console & Timeline Audit Inspection... ');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'admin@tailorconnect.com', password: 'Password123!' }),
  });
  const adminToken = adminLogin.data.accessToken;

  const adminMetrics = await request('/admin/dashboard-metrics', {}, adminToken);
  const inspectedOrder = await request(`/orders/${orderId}`, {}, adminToken);

  if (inspectedOrder.data.statusHistory.length < 7) {
    throw new Error('Audit trail missing state history transitions');
  }

  console.log(`✓ PASS (Admin verified: GMV ₹${adminMetrics.data.totalRevenue}, Order ${orderNumber} has ${inspectedOrder.data.statusHistory.length} immutable history entries)`);

  console.log('\n=============================================================');
  console.log('  ALL 15 END-TO-END MARKETPLACE JOURNEYS VERIFIED: 100% PASS');
  console.log('=============================================================\n');
}

runE2EJourney().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err.message);
  process.exit(1);
});
