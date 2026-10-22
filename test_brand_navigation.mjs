import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 BRAND LOGO & DASHBOARD NAVIGATION PARITY TEST');
console.log('====================================================\n');

const navbarPath = path.resolve('frontend/src/components/layout/Navbar.tsx');
const sidebarPath = path.resolve('frontend/src/components/layout/Sidebar.tsx');
const footerPath = path.resolve('frontend/src/components/layout/Footer.tsx');
const homePath = path.resolve('frontend/src/pages/public/HomePage.tsx');

const navbarContent = fs.readFileSync(navbarPath, 'utf8');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
const footerContent = fs.readFileSync(footerPath, 'utf8');
const homeContent = fs.readFileSync(homePath, 'utf8');

let errors = [];

// 1. Sidebar check
console.log('1. Checking Sidebar brand navigation...');
if (sidebarContent.includes('<Link to="/" className="flex items-center space-x-3 group">')) {
  errors.push('Sidebar brand header still contains hardcoded <Link to="/">');
} else if (sidebarContent.includes('<Link to={getDashboardHome()} className="flex items-center space-x-3 group">')) {
  console.log('  ✅ Sidebar desktop brand link routes to getDashboardHome()');
} else {
  errors.push('Sidebar desktop brand link did not match expected getDashboardHome() pattern');
}

if (sidebarContent.includes('<Link to={getDashboardHome()} className="flex items-center space-x-2 group">')) {
  console.log('  ✅ Sidebar mobile bar brand link routes to getDashboardHome()');
} else {
  errors.push('Sidebar mobile bar brand link did not match expected getDashboardHome() pattern');
}

// 2. Navbar check
console.log('\n2. Checking Navbar brand navigation...');
if (navbarContent.includes('<Link to="/" className="flex items-center space-x-3 shrink-0 group">')) {
  errors.push('Navbar brand logo still contains hardcoded <Link to="/">');
} else if (navbarContent.includes('<Link to={getBrandHomePath()} className="flex items-center space-x-3 shrink-0 group">')) {
  console.log('  ✅ Navbar brand logo routes to dynamic getBrandHomePath()');
} else {
  errors.push('Navbar brand logo did not match expected getBrandHomePath() pattern');
}

if (navbarContent.includes("label: isAuthenticated ? t('nav.dashboards') : t('nav.home')")) {
  console.log('  ✅ Navbar primary navigation item dynamically shows Dashboard when authenticated');
} else {
  errors.push('Navbar publicLinks primary item does not switch to Dashboard when authenticated');
}

// 3. Footer check
console.log('\n3. Checking Footer brand navigation...');
if (footerContent.includes('<Link to={getBrandHomePath()} className="flex items-center space-x-3 group">')) {
  console.log('  ✅ Footer brand logo routes to dynamic getBrandHomePath()');
} else {
  errors.push('Footer brand logo does not route to dynamic getBrandHomePath()');
}

// 4. HomePage session check
console.log('\n4. Checking HomePage active session awareness...');
if (homeContent.includes('Active User Session Notice') && homeContent.includes('getUserDashboardPath()')) {
  console.log('  ✅ HomePage displays persistent active session notice with one-click return to dashboard');
} else {
  errors.push('HomePage lacks active session notice banner');
}

console.log('\n====================================================');
if (errors.length === 0) {
  console.log('🎉 ALL BRAND NAVIGATION AND PERSISTENCE CHECKS PASSED! 🚀');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ FAILURES DETECTED:');
  errors.forEach(e => console.error('  - ' + e));
  console.log('====================================================');
  process.exit(1);
}
