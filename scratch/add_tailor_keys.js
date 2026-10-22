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

const extraEn = {
  rating: "Rating",
  experience: "Experience",
  years: "Years",
  turnaround: "Turnaround",
  days: "Days",
  startingAt: "Starting At",
  philosophy: "Shop & Tailor Details",
  specialties: "Specialties & Garment Types",
  verified: "Verified Shop",
  close: "Close",
  bookConsultation: "Book Consultation",
  bookWith: "Book Consultation with {shopName}",
  modalDesc: "Enter your fit requirements to connect with the tailor.",
  requestedGarment: "Requested Garment",
  preferredDate: "Preferred Fitting Date",
  clientNotes: "Notes & Special Requests",
  notesPlaceholder: "Mention fitting details, preferences, or timeline...",
  confirmBooking: "Confirm Booking"
};

const extraTe = {
  rating: "రేటింగ్",
  experience: "అనుభవం",
  years: "సంవత్సరాలు",
  turnaround: "డెలివరీ సమయం",
  days: "రోజులు",
  startingAt: "ప్రారంభ ధర",
  philosophy: "షాప్ & దర్జీ వివరాలు",
  specialties: "ప్రత్యేకతలు & వస్త్ర రకాలు",
  verified: "ధృవీకరించబడిన షాప్",
  close: "మూసివేయి",
  bookConsultation: "సంప్రదింపుల కోసం బుక్ చేయండి",
  bookWith: "{shopName} తో సంప్రదింపులను బుక్ చేయండి",
  modalDesc: "దర్జీతో మాట్లాడటానికి మీ అవసరాలను నమోదు చేయండి.",
  requestedGarment: "కావలసిన వస్త్రం",
  preferredDate: "అనుకూలమైన తేదీ",
  clientNotes: "సూచనలు & ప్రత్యేక కోరికలు",
  notesPlaceholder: "ఫిట్టింగ్ వివరాలు లేదా ప్రత్యేక కోరికలు ఇక్కడ రాయండి...",
  confirmBooking: "బుకింగ్ నిర్ధారించండి"
};

const extraHi = {
  rating: "रेटिंग",
  experience: "अनुभव",
  years: "वर्ष",
  turnaround: "डिलीवरी समय",
  days: "दिन",
  startingAt: "शुरुआती कीमत",
  philosophy: "दुकान और दर्जी का विवरण",
  specialties: "विशेषताएं और कपड़े",
  verified: "सत्यापित दुकान",
  close: "बंद करें",
  bookConsultation: "परामर्श बुक करें",
  bookWith: "{shopName} के साथ परामर्श बुक करें",
  modalDesc: "दर्जी से बात करने के लिए अपनी आवश्यकताएं दर्ज करें।",
  requestedGarment: "कपड़े का प्रकार",
  preferredDate: "पसंदीदा तारीख",
  clientNotes: "विशेष सुझाव और मांग",
  notesPlaceholder: "फिटिंग और अपनी पसंद यहां लिखें...",
  confirmBooking: "बुकिंग कन्फर्म करें"
};

Object.assign(en.tailorDiscovery, extraEn);
Object.assign(te.tailorDiscovery, extraTe);
Object.assign(hi.tailorDiscovery, extraHi);

fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'te.json'), JSON.stringify(te, null, 2), 'utf8');
fs.writeFileSync(path.join(localesDir, 'hi.json'), JSON.stringify(hi, null, 2), 'utf8');

console.log('✅ Updated tailorDiscovery keys in en, te, hi!');
