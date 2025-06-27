'use client';

import { NavGroup } from './sidebar-items';
import React from 'react';

// Icons for the remaining categories
const QRCodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);

const SMSIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

const BrandingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const RolesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ReportsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SecurityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const AdminToolsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

export const navigationDataPart3: NavGroup[] = [
  {
    name: "QR & Customer PWA",
    icon: <QRCodeIcon />,
    roles: ["admin"],
    items: [
      { name: "QR Code Generator", href: "/dashboard/qr-codes" },
      { name: "Customize PWA Theme", href: "/dashboard/qr-codes/pwa-theme" },
      { name: "Customer Welcome Page", href: "/dashboard/qr-codes/welcome" },
      { name: "Add-to-Home Screen Settings", href: "/dashboard/qr-codes/home-screen" }
    ]
  },
  {
    name: "SMS & Notifications",
    icon: <SMSIcon />,
    roles: ["admin"],
    items: [
      { name: "SMS Templates", href: "/dashboard/notifications/templates" },
      { name: "Customer Alerts", href: "/dashboard/notifications/customer" },
      { name: "Staff Alerts", href: "/dashboard/notifications/staff" },
      { name: "Notification Settings", href: "/dashboard/notifications/settings" }
    ]
  },
  {
    name: "Branding & Customization",
    icon: <BrandingIcon />,
    roles: ["admin"],
    items: [
      { name: "Upload Logo", href: "/dashboard/branding/logo" },
      { name: "Choose Color Theme", href: "/dashboard/branding/theme" },
      { name: "Font & Button Styles", href: "/dashboard/branding/styles" },
      { name: "Branded Subdomain Info", href: "/dashboard/branding/subdomain" }
    ]
  },
  {
    name: "Settings",
    icon: <SettingsIcon />,
    roles: ["admin"],
    items: [
      { name: "Restaurant Info", href: "/dashboard/settings" },
      { name: "Payment Gateway Setup", href: "/dashboard/settings/payments" },
      { name: "SMS Integration", href: "/dashboard/settings/sms" },
      { name: "Language & Timezone", href: "/dashboard/settings/localization" },
      { name: "Business Hours", href: "/dashboard/settings/hours" },
      { name: "Feature Toggles", href: "/dashboard/settings/features" },
      { name: "PWA Settings", href: "/dashboard/settings/pwa" }
    ]
  },
  {
    name: "Roles & Permissions",
    icon: <RolesIcon />,
    roles: ["admin"],
    items: [
      { name: "Role Management", href: "/dashboard/roles" },
      { name: "Permission Matrix", href: "/dashboard/roles/permissions" },
      { name: "Access Logs", href: "/dashboard/roles/access-logs" }
    ]
  },
  {
    name: "Reports & Exports",
    icon: <ReportsIcon />,
    roles: ["admin"],
    items: [
      { name: "Sales Reports", href: "/dashboard/reports/sales" },
      { name: "Inventory Reports", href: "/dashboard/reports/inventory" },
      { name: "Order History Export", href: "/dashboard/reports/orders" },
      { name: "Reservation Logs", href: "/dashboard/reports/reservations" },
      { name: "Staff Activity Report", href: "/dashboard/reports/staff" },
      { name: "Export to PDF/CSV", href: "/dashboard/reports/export" }
    ]
  },
  {
    name: "Audit Logs & Security",
    icon: <SecurityIcon />,
    roles: ["admin"],
    items: [
      { name: "Staff Login Logs", href: "/dashboard/audit/logins" },
      { name: "Change Logs", href: "/dashboard/audit/changes" },
      { name: "Waiter Call Response Logs", href: "/dashboard/audit/waiter-calls" },
      { name: "Data Backup & Restore", href: "/dashboard/audit/backup" }
    ]
  },
  {
    name: "Admin Tools",
    icon: <AdminToolsIcon />,
    roles: ["owner", "admin", "manager"],
    items: [
      { name: "Seed Sample Data", href: "/dashboard/admin/seed-data" },
      { name: "System Health", href: "/dashboard/admin/system-health" },
      { name: "Background Tasks", href: "/dashboard/admin/background-tasks" }
    ]
  }
];
