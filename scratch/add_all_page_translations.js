import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const localesDir = path.join(projectRoot, 'frontend', 'src', 'i18n', 'locales');

const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const te = JSON.parse(fs.readFileSync(path.join(localesDir, 'te.json'), 'utf8'));
const hi = JSON.parse(fs.readFileSync(path.join(localesDir, 'hi.json'), 'utf8'));

// 1. Contact Page Translations
en.contact = {
  badge: "Customer Support & Contact",
  title: "Get in Touch With Us",
  subtitle: "Have questions about custom stitching, your orders, or tailor partnerships? We are here to help.",
  formTitle: "Send Us a Message",
  formSubtitle: "Fill in your details and our team will get in touch with you directly.",
  fullName: "Full Name",
  namePlaceholder: "e.g. Rahul Sharma",
  email: "Email Address",
  emailPlaceholder: "e.g. rahul@example.com",
  phone: "Phone / WhatsApp",
  phonePlaceholder: "e.g. 9876543210",
  inquiryType: "Inquiry Type",
  types: {
    customOrder: "Custom Stitching Order",
    tailorPartner: "Tailor Shop Registration / Partnership",
    doorstep: "Doorstep Tailor Measurement Request",
    fabrics: "Fabric Sourcing & Material Question",
    general: "General Help & Support"
  },
  message: "Your Message or Clothing Details",
  messagePlaceholder: "Describe the clothes you want stitched, fabric preferences, required delivery date, or any questions...",
  confidential: "Quick Response Guaranteed",
  sendBtn: "Send Message",
  sending: "Sending Message...",
  directLineTitle: "Customer Helpline",
  directLineDesc: "Available Monday to Saturday (9:30 AM to 6:30 PM) for urgent order questions and fitting help.",
  supportCentersTitle: "Regional Support Offices",
  offices: {
    office1City: "Hyderabad Support Center",
    office1Address: "Banjara Hills, Road No. 12, Hyderabad, Telangana",
    office1Hours: "Mon – Sat: 09:30 – 18:30 IST",
    office2City: "Mumbai Support Center",
    office2Address: "Bandra West, Linking Road, Mumbai, Maharashtra",
    office2Hours: "Mon – Sat: 09:30 – 18:30 IST",
    office3City: "Vijayawada Support Center",
    office3Address: "MG Road, Governorpet, Vijayawada, Andhra Pradesh",
    office3Hours: "Mon – Sat: 09:30 – 18:30 IST"
  },
  toastSuccess: "Message Sent Successfully!",
  toastSuccessDesc: "Our support team will get in touch with you shortly."
};

te.contact = {
  badge: "కస్టమర్ సపోర్ట్ & సంప్రదింపులు",
  title: "మమ్మల్ని సంప్రదించండి",
  subtitle: "బట్టల కుట్టు, ఆర్డర్లు లేదా దర్జీ షాప్ నమోదు గురించి ఏవైనా ప్రశ్నలు ఉన్నాయా? మీకు సహాయం చేయడానికి మేము సిద్ధంగా ఉన్నాము.",
  formTitle: "మాకు సందేశం పంపండి",
  formSubtitle: "మీ వివరాలను పూరించండి, మా బృందం వెంటనే మిమ్మల్ని సంప్రదిస్తుంది.",
  fullName: "పూర్తి పేరు",
  namePlaceholder: "ఉదా: రాహుల్ శర్మ",
  email: "ఈమెయిల్ చిరునామా",
  emailPlaceholder: "ఉదా: rahul@example.com",
  phone: "ఫోన్ నంబర్ / వాట్సాప్",
  phonePlaceholder: "ఉదా: 9876543210",
  inquiryType: "విచారణ రకం",
  types: {
    customOrder: "బట్టల కుట్టు ఆర్డర్ విచారణ",
    tailorPartner: "దర్జీ షాప్ నమోదు / భాగస్వామ్యం",
    doorstep: "ఇంటి వద్దకే కొలతల కోసం అభ్యర్థన",
    fabrics: "వస్త్రాలు & మెటీరియల్ సమాచారం",
    general: "సాధారణ సహాయం & సపోర్ట్"
  },
  message: "మీ సందేశం లేదా దుస్తుల వివరాలు",
  messagePlaceholder: "మీకు ఎలాంటి బట్టలు కుట్టించాలి, వస్త్రం వివరాలు లేదా ఎప్పటికి కావాలో ఇక్కడ రాయండి...",
  confidential: "సత్వర స్పందన హామీ",
  sendBtn: "సందేశం పంపండి",
  sending: "పంపబడుతోంది...",
  directLineTitle: "కస్టమర్ సపోర్ట్ హెల్ప్‌లైన్",
  directLineDesc: "సోమవారం నుండి శనివారం వరకు (ఉదయం 9:30 నుండి సాయంత్రం 6:30 వరకు) ఆర్డర్ వివరాలు మరియు సహాయం కోసం అందుబాటులో ఉంటుంది.",
  supportCentersTitle: "సహాయ కేంద్రాలు & కార్యాలయాలు",
  offices: {
    office1City: "హైదరాబాద్ సపోర్ట్ కేంద్రం",
    office1Address: "బంజారా హిల్స్, రోడ్ నం. 12, హైదరాబాద్, తెలంగాణ",
    office1Hours: "సోమ – శని: 09:30 – 18:30 IST",
    office2City: "ముంబై సపోర్ట్ కేంద్రం",
    office2Address: "బాంద్రా వెస్ట్, లింకింగ్ రోడ్, ముంబై, మహారాష్ట్ర",
    office2Hours: "సోమ – శని: 09:30 – 18:30 IST",
    office3City: "విజయవాడ సపోర్ట్ కేంద్రం",
    office3Address: "ఎం.జి. రోడ్డు, గవర్నర్‌పేట, విజయవాడ, ఆంధ్రప్రదేశ్",
    office3Hours: "సోమ – శని: 09:30 – 18:30 IST"
  },
  toastSuccess: "సందేశం విజయవంతంగా పంపబడింది!",
  toastSuccessDesc: "మా సపోర్ట్ బృందం త్వరలోనే మిమ్మల్ని సంప్రదిస్తుంది."
};

hi.contact = {
  badge: "ग्राहक सहायता और संपर्क",
  title: "हमसे संपर्क करें",
  subtitle: "कपड़े सिलवाने, ऑर्डर्स या दर्जी पार्टनरशिप के बारे में कोई सवाल है? हम आपकी मदद के लिए तैयार हैं।",
  formTitle: "हमें संदेश भेजें",
  formSubtitle: "अपनी जानकारी भरें, हमारी टीम जल्द ही आपसे संपर्क करेगी।",
  fullName: "पूरा नाम",
  namePlaceholder: "जैसे: राहुल शर्मा",
  email: "ईमेल पता",
  emailPlaceholder: "जैसे: rahul@example.com",
  phone: "फ़ोन नंबर / व्हाट्सएप",
  phonePlaceholder: "जैसे: 9876543210",
  inquiryType: "पूछताछ का प्रकार",
  types: {
    customOrder: "कपड़े सिलाई ऑर्डर पूछताछ",
    tailorPartner: "दर्जी दुकान रजिस्ट्रेशन / पार्टनरशिप",
    doorstep: "घर पर नाप लेने का अनुरोध",
    fabrics: "कपड़ा और सामग्री की जानकारी",
    general: "सामान्य सहायता और मदद"
  },
  message: "आपका संदेश या कपड़ों की जानकारी",
  messagePlaceholder: "आपको कौन से कपड़े सिलवाने हैं, क्या आवश्यकताएं हैं या समय सीमा यहां लिखें...",
  confidential: "त्वरित समाधान गारंटी",
  sendBtn: "संदेश भेजें",
  sending: "भेजा जा रहा है...",
  directLineTitle: "ग्राहक सहायता हेल्पलाइन",
  directLineDesc: "सोमवार से शनिवार (सुबह 9:30 से शाम 6:30) तक ऑर्डर जानकारी और सहायता के लिए उपलब्ध।",
  supportCentersTitle: "सपोर्ट केंद्र और कार्यालय",
  offices: {
    office1City: "हैदराबाद सपोर्ट सेंटर",
    office1Address: "बंजारा हिल्स, रोड नंबर 12, हैदराबाद, तेलंगाना",
    office1Hours: "सोम – शनि: 09:30 – 18:30 IST",
    office2City: "मुंबई सपोर्ट सेंटर",
    office2Address: "बांद्रा वेस्ट, लिंकिंग रोड, मुंबई, महाराष्ट्र",
    office2Hours: "सोम – शनि: 09:30 – 18:30 IST",
    office3City: "विजयवाड़ा सपोर्ट सेंटर",
    office3Address: "एम.जी. रोड, गवर्नरपेट, विजयवाड़ा, आंध्र प्रदेश",
    office3Hours: "सोम – शनि: 09:30 – 18:30 IST"
  },
  toastSuccess: "संदेश सफलतापूर्वक भेजा गया!",
  toastSuccessDesc: "हमारी टीम जल्द ही आपसे संपर्क करेगी।"
};

// 2. About Page Translations
en.about = {
  badge: "About ThreadCraft",
  heroTitle: "Connecting Local Tailors With Modern Customers",
  heroSubtitle: "We help people get perfectly fitting custom clothes while empowering local tailoring shops to grow their business online.",
  visionBadge: "Our Vision",
  visionTitle: "Every Garment Should Fit You Perfectly",
  visionP1: "Readymade clothes rarely fit everyone well. Custom tailoring ensures your clothes are stitched specifically for your unique body measurements and personal style.",
  visionP2: "We combine modern online measurements and tracking with traditional tailoring craftsmanship so you get perfectly stitched clothes delivered right to your home.",
  check1: "100% Perfect Fit Guarantee",
  check2: "Transparent Order Tracking",
  masterBenchTitle: "Quality Tailoring Promise",
  masterBenchSubtitle: "Every garment is cut and stitched to your unique measurements by experienced tailors.",
  pillarsBadge: "Why Choose Us",
  pillarsTitle: "The Four Principles of ThreadCraft",
  pillar1Title: "Verified Skilled Tailors",
  pillar1Desc: "Every tailor shop on our platform is verified for quality craftsmanship and reliable delivery.",
  pillar2Title: "Accurate Saved Measurements",
  pillar2Desc: "Save your body measurements once online to re-order anytime without measuring again.",
  pillar3Title: "Quality Stitching & Fabrics",
  pillar3Desc: "Durable stitching and comfortable fabrics that look great and last longer.",
  pillar4Title: "Support Local Businesses",
  pillar4Desc: "When you order through us, you directly support local small businesses and skilled craftsmen.",
  ctaTitle: "Ready to Get Your Custom Clothes Stitched?",
  ctaSubtitle: "Browse verified tailor shops near you and place your order today.",
  findTailorBtn: "Find a Tailor",
  contactUsBtn: "Contact Us"
};

te.about = {
  badge: "ThreadCraft గురించి",
  heroTitle: "స్థానిక దర్జీలను ఆధునిక కస్టమర్లతో అనుసంధానించడం",
  heroSubtitle: "ప్రజలకు సరైన ఫిట్టింగ్ బట్టలు కుట్టించడంలో మరియు స్థానిక దర్జీలకు ఆన్‌లైన్‌లో వ్యాపారాన్ని పెంచుకోవడంలో మేము సహాయం చేస్తాము.",
  visionBadge: "మా లక్ష్యం",
  visionTitle: "ప్రతి వస్త్రం మీకు సరిగ్గా సరిపోవాలి",
  visionP1: "రెడీమేడ్ బట్టలు అందరికీ సరిగ్గా సరిపోవు. కస్టమ్ టైలరింగ్ ద్వారా మీ శరీర కొలతలకు, మీ వ్యక్తిగత శైలికి సరిపోయేలా బట్టలు కుట్టబడతాయి.",
  visionP2: "మేము ఆధునిక ఆన్‌లైన్ కొలతలు మరియు ట్రాకింగ్‌ను సాంప్రదాయ కుట్టు నైపుణ్యంతో కలిపి, మీ ఇంటి వద్దకే డెలివరీ అందిస్తున్నాము.",
  check1: "100% పర్ఫెక్ట్ ఫిట్టింగ్ హామీ",
  check2: "స్పష్టమైన ఆర్డర్ ట్రాకింగ్",
  masterBenchTitle: "నాణ్యమైన కుట్టు వాగ్దానం",
  masterBenchSubtitle: "అనుభవజ్ఞులైన దర్జీలు మీ శరీర కొలతలకు తగినట్లుగా బట్టలు కట్ చేసి కుడతారు.",
  pillarsBadge: "మమ్మల్ని ఎందుకు ఎంచుకోవాలి?",
  pillarsTitle: "ThreadCraft యొక్క నాలుగు ముఖ్య సూత్రాలు",
  pillar1Title: "ధృవీకరించబడిన నిపుణులైన దర్జీలు",
  pillar1Desc: "మా ప్లాట్‌ఫారమ్‌లోని ప్రతి దర్జీ షాప్ నాణ్యమైన కుట్టుపని మరియు సమయానికి డెలివరీ కోసం తనిఖీ చేయబడుతుంది.",
  pillar2Title: "ఖచ్చితమైన కొలతలు",
  pillar2Desc: "మీ కొలతలను ఒక్కసారి నమోదు చేస్తే, ఎప్పుడైనా మళ్ళీ కొలవకుండా సులభంగా ఆర్డర్ చేసుకోవచ్చు.",
  pillar3Title: "నాణ్యమైన కుట్టు & వస్త్రాలు",
  pillar3Desc: "బలమైన కుట్టు మరియు ఎక్కువ కాలం మన్నే నాణ్యమైన సౌకర్యవంతమైన వస్త్రాలు.",
  pillar4Title: "స్థానిక దర్జీలకు నేరుగా మద్దతు",
  pillar4Desc: "మీరు మా ద్వారా ఆర్డర్ చేసినప్పుడు, స్థానిక చిన్న వ్యాపారాలు మరియు దర్జీ కళాకారులకు నేరుగా తోడ్పాటు అందుతుంది.",
  ctaTitle: "మీ బట్టలు కుట్టించుకోవడానికి సిద్ధంగా ఉన్నారా?",
  ctaSubtitle: "మీ దగ్గర్లోని దర్జీ షాపులను చూడండి మరియు ఈరోజే మీ ఆర్డర్ ఇవ్వండి.",
  findTailorBtn: "దర్జీని ఎంచుకోండి",
  contactUsBtn: "సంప్రదించండి"
};

hi.about = {
  badge: "ThreadCraft के बारे में",
  heroTitle: "स्थानीय दर्जियों को आधुनिक ग्राहकों से जोड़ना",
  heroSubtitle: "हम लोगों को सही फिटिंग के कपड़े सिलवाने और स्थानीय दर्जियों का व्यापार ऑनलाइन बढ़ाने में मदद करते हैं।",
  visionBadge: "हमारा उद्देश्य",
  visionTitle: "हर कपड़ा आप पर परफेक्ट फिट होना चाहिए",
  visionP1: "रेडीमेड कपड़े हर किसी पर सही नहीं बैठते। कस्टम सिलाई से आपके नाप और पसंद के अनुसार कपड़े तैयार होते हैं।",
  visionP2: "हम आधुनिक ऑनलाइन नाप और ट्रैकिंग के साथ बेहतरीन सिलाई सीधे आपके घर तक पहुंचाते हैं।",
  check1: "100% परफेक्ट फिटिंग गारंटी",
  check2: "पारदर्शी ऑर्डर ट्रैकिंग",
  masterBenchTitle: "गुणवत्ता सिलाई का वादा",
  masterBenchSubtitle: "अनुभवी दर्जियों द्वारा आपकी सही नाप के अनुसार कपड़े काटे और सिले जाते हैं।",
  pillarsBadge: "हमें क्यों चुनें?",
  pillarsTitle: "ThreadCraft के चार मुख्य सिद्धांत",
  pillar1Title: "सत्यापित कुशल दर्जी",
  pillar1Desc: "हमारे प्लेटफ़ॉर्म पर हर दर्जी की दुकान बेहतरीन सिलाई और समय पर डिलीवरी के लिए जांची जाती है।",
  pillar2Title: "सटीक सहेजी गई नाप",
  pillar2Desc: "अपनी नाप एक बार सेव करें और कभी भी बिना दोबारा नापे आसानी से ऑर्डर दें।",
  pillar3Title: "मजबूत सिलाई और कपड़े",
  pillar3Desc: "टिकाऊ धागे, मजबूत सिलाई और लंबे समय तक चलने वाले कपड़े।",
  pillar4Title: "स्थानीय दर्जियों को सीधा सहयोग",
  pillar4Desc: "हमारे जरिए ऑर्डर देकर आप स्थानीय छोटे व्यापारों और हुनरमंद कारीगरों को बढ़ावा देते हैं।",
  ctaTitle: "क्या आप कपड़े सिलवाने के लिए तैयार हैं?",
  ctaSubtitle: "अपने पास के दर्जी देखें और आज ही अपना ऑर्डर दें।",
  findTailorBtn: "दर्जी खोजें",
  contactUsBtn: "संपर्क करें"
};

// 3. Services Page Translations
en.servicesPage = {
  badge: "Our Tailoring Services",
  title: "Custom Stitching & Tailoring for Every Occasion",
  subtitle: "From custom suits and festive wear to alterations and doorstep measuring, explore our services.",
  startsAt: "Starts at ${price}",
  serviceStandards: "What's Included",
  requestQuote: "Book This Service",
  modalTitle: "Book Service: {serviceTitle}",
  modalDesc: "Provide your details and a nearby tailor will connect with you.",
  yourName: "Your Full Name",
  namePlaceholder: "e.g. Rahul Sharma",
  email: "Email Address",
  emailPlaceholder: "e.g. rahul@example.com",
  city: "City / Area",
  cityPlaceholder: "e.g. Hyderabad, Mumbai",
  details: "Outfit Requirements & Preferred Timeline",
  detailsPlaceholder: "Describe what you want stitched, fabric preferences, or preferred date...",
  cancel: "Cancel",
  submitInquiry: "Submit Request",
  successToast: "Service Request Sent!",
  successToastDesc: "Our team has sent your request for \"{serviceTitle}\" to top verified tailors nearby."
};

te.servicesPage = {
  badge: "మా టైలరింగ్ సేవలు",
  title: "ప్రతి సందర్భానికి సరిపోయే కస్టమ్ టైలరింగ్ సేవలు",
  subtitle: "సూట్లు మరియు పండుగ దుస్తుల నుండి ఆల్టరేషన్లు మరియు ఇంటి వద్ద కొలతల వరకు మా సేవలను పరిశీలించండి.",
  startsAt: "${price} నుండి ప్రారంభం",
  serviceStandards: "ఇందులో ఏమున్నాయి?",
  requestQuote: "సర్వీస్ బుక్ చేయండి",
  modalTitle: "సర్వీస్ బుకింగ్: {serviceTitle}",
  modalDesc: "మీ వివరాలను ఇవ్వండి, సమీపంలోని దర్జీ మిమ్మల్ని సంప్రదిస్తారు.",
  yourName: "మీ పూర్తి పేరు",
  namePlaceholder: "ఉదా: రాహుల్ శర్మ",
  email: "ఈమెయిల్ చిరునామా",
  emailPlaceholder: "ఉదా: rahul@example.com",
  city: "ఊరు / ప్రాంతం",
  cityPlaceholder: "ఉదా: హైదరాబాద్, విజయవాడ",
  details: "దుస్తుల అవసరాలు & కావలసిన తేదీ",
  detailsPlaceholder: "మీకు ఎలాంటి బట్టలు కావాలి, వస్త్రం వివరాలు లేదా ఎప్పటికి కావాలో రాయండి...",
  cancel: "రద్దు చేయండి",
  submitInquiry: "రిక్వెస్ట్ పంపండి",
  successToast: "రిక్వెస్ట్ విజయవంతంగా పంపబడింది!",
  successToastDesc: "\"{serviceTitle}\" కొరకు మీ రిక్వెస్ట్ సమీపంలోని ఉత్తమ దర్జీలకు పంపబడింది."
};

hi.servicesPage = {
  badge: "हमारी सिलाई सेवाएं",
  title: "हर अवसर के लिए कस्टम सिलाई सेवाएं",
  subtitle: "सूट और पारंपरिक कपड़ों से लेकर अल्टरेशन और होम नाप तक हमारी सेवाएं देखें।",
  startsAt: "${price} से शुरू",
  serviceStandards: "शामिल सुविधाएं",
  requestQuote: "सर्विस बुक करें",
  modalTitle: "सर्विस बुकिंग: {serviceTitle}",
  modalDesc: "अपनी जानकारी दें, नजदीकी दर्जी आपसे संपर्क करेगा।",
  yourName: "आपका पूरा नाम",
  namePlaceholder: "जैसे: राहुल शर्मा",
  email: "ईमेल पता",
  emailPlaceholder: "जैसे: rahul@example.com",
  city: "शहर / इलाका",
  cityPlaceholder: "जैसे: दिल्ली, हैदराबाद",
  details: "कपड़ों की आवश्यकताएं और पसंदीदा तारीख",
  detailsPlaceholder: "आपको कौन से कपड़े चाहिए, कपड़े का प्रकार या समय सीमा यहां लिखें...",
  cancel: "रद्द करें",
  submitInquiry: "अनुरोध भेजें",
  successToast: "अनुरोध सफलतापूर्वक भेजा गया!",
  successToastDesc: "\"{serviceTitle}\" के लिए आपका अनुरोध नजदीकी शीर्ष दर्जियों को भेज दिया गया है।"
};

// 4. Categories map for FindTailorsPage
en.categories = {
  all: "All",
  suits: "Custom Suits",
  tuxedos: "Festive & Party Wear",
  bridal: "Bridal & Blouses",
  alterations: "Alterations & Fitting",
  sherwanis: "Sherwanis & Kurtas",
  linen: "Shirts & Trousers"
};

te.categories = {
  all: "అన్నీ",
  suits: "సూట్లు & బ్లేజర్లు",
  tuxedos: "పార్టీ & పెళ్లి బట్టలు",
  bridal: "పెళ్లి దుస్తులు & బ్లౌజులు",
  alterations: "ఆల్టరేషన్లు & ఫిట్టింగ్",
  sherwanis: "షేర్వానీలు & కుర్తాలు",
  linen: "షర్టులు & ప్యాంట్లు"
};

hi.categories = {
  all: "सभी",
  suits: "सूट और ब्लेज़र",
  tuxedos: "पार्टी और शादी के कपड़े",
  bridal: "शादी के कपड़े और ब्लाउज",
  alterations: "अल्टरेशन और फिटिंग",
  sherwanis: "शेरवानी और कुर्ते",
  linen: "शर्ट और पैंट"
};

fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'te.json'), JSON.stringify(te, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'hi.json'), JSON.stringify(hi, null, 2), 'utf8');

console.log('✅ Updated en.json, te.json, hi.json with contact, about, servicesPage, categories!');
