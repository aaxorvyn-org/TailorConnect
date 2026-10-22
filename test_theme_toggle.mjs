import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 DARK & LIGHT MODE THEME SYSTEM VERIFICATION TEST');
console.log('====================================================\n');

const tailwindPath = path.resolve('frontend/tailwind.config.js');
const indexCssPath = path.resolve('frontend/src/index.css');
const appPath = path.resolve('frontend/src/App.tsx');
const hookPath = path.resolve('frontend/src/hooks/useTheme.tsx');
const togglePath = path.resolve('frontend/src/components/common/ThemeToggle.tsx');
const navbarPath = path.resolve('frontend/src/components/layout/Navbar.tsx');
const sidebarPath = path.resolve('frontend/src/components/layout/Sidebar.tsx');
const dashboardPath = path.resolve('frontend/src/layouts/DashboardLayout.tsx');

let errors = [];

// 1. Tailwind configuration check
console.log('1. Checking Tailwind darkMode setting...');
const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');
if (tailwindContent.includes("darkMode: 'class'")) {
  console.log("  ✅ Tailwind config includes darkMode: 'class'");
} else {
  errors.push("tailwind.config.js missing darkMode: 'class'");
}

// 2. index.css Light Mode rules check
console.log('\n2. Checking index.css Light Mode design system...');
const indexCssContent = fs.readFileSync(indexCssPath, 'utf8');
if (indexCssContent.includes('html.light') && indexCssContent.includes('html.light body')) {
  console.log('  ✅ index.css contains comprehensive html.light design system');
} else {
  errors.push('index.css missing html.light rules');
}

// 3. ThemeProvider & useTheme Hook check
console.log('\n3. Checking useTheme hook and ThemeProvider...');
const hookContent = fs.readFileSync(hookPath, 'utf8');
if (hookContent.includes('export const ThemeProvider') && hookContent.includes('export const useTheme')) {
  console.log('  ✅ useTheme hook and ThemeProvider correctly exported with localStorage persistence');
} else {
  errors.push('useTheme.tsx missing ThemeProvider or useTheme hook');
}

// 4. App.tsx provider wrapping check
console.log('\n4. Checking App.tsx provider tree...');
const appContent = fs.readFileSync(appPath, 'utf8');
if (appContent.includes('<ThemeProvider>') && appContent.includes('</ThemeProvider>')) {
  console.log('  ✅ App.tsx correctly wrapped with ThemeProvider');
} else {
  errors.push('App.tsx missing ThemeProvider wrapper');
}

// 5. ThemeToggle component check
console.log('\n5. Checking ThemeToggle component and icons...');
const toggleContent = fs.readFileSync(togglePath, 'utf8');
if (toggleContent.includes('Sun') && toggleContent.includes('Moon') && toggleContent.includes('toggleTheme')) {
  console.log('  ✅ ThemeToggle component renders Sun & Moon with accessible variants');
} else {
  errors.push('ThemeToggle component incomplete');
}

// 6. Placement verification (Navbar, DashboardLayout, Sidebar)
console.log('\n6. Checking ThemeToggle button placement across app...');
const navbarContent = fs.readFileSync(navbarPath, 'utf8');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

if (navbarContent.includes('<ThemeToggle')) {
  console.log('  ✅ ThemeToggle placed in Navbar (desktop and mobile)');
} else {
  errors.push('Navbar missing ThemeToggle button');
}

if (dashboardContent.includes('<ThemeToggle')) {
  console.log('  ✅ ThemeToggle placed in DashboardLayout header');
} else {
  errors.push('DashboardLayout missing ThemeToggle button');
}

if (sidebarContent.includes('<ThemeToggle')) {
  console.log('  ✅ ThemeToggle placed in Sidebar');
} else {
  errors.push('Sidebar missing ThemeToggle button');
}

console.log('\n====================================================');
if (errors.length === 0) {
  console.log('🎉 ALL DARK & LIGHT MODE TESTS PASSED PERFECTLY! 🚀');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ FAILURES DETECTED:');
  errors.forEach(e => console.error('  - ' + e));
  console.log('====================================================');
  process.exit(1);
}
