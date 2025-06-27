'use client';

import { NavGroup } from './sidebar-items';
import React from 'react';

// Icons for main categories
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const InventoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0l-8 4m-8-4l8 4" />
  </svg>
);

const OrdersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const TableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

export const navigationData: NavGroup[] = [
  {
    name: "Dashboard",
    icon: <DashboardIcon />,
    roles: ["admin", "staff", "kitchen"],
    items: [
      { name: "Overview", href: "/dashboard" },
      { name: "Live Orders", href: "/dashboard/live-orders" },
      { name: "Quick Stats", href: "/dashboard/quick-stats" },
      { name: "AI Insights", href: "/dashboard/ai-summary" }
    ]
  },
  {
    name: "Menu Management",
    icon: <MenuIcon />,
    roles: ["admin", "staff"],
    items: [
      { name: "View Menu", href: "/dashboard/menu" },
      { name: "Categories & Sections", href: "/dashboard/menu/categories" },
      { name: "Item Modifiers", href: "/dashboard/menu/modifiers" },
      { name: "Recipe Builder", href: "/dashboard/menu/recipe-builder" },
      { name: "Menu Availability", href: "/dashboard/menu/availability" }
    ]
  },
  {
    name: "Inventory",
    icon: <InventoryIcon />,
    roles: ["admin", "staff"],
    items: [
      { name: "Ingredients", href: "/dashboard/inventory" },
      { name: "Stock In / Out", href: "/dashboard/inventory/stock" },
      { name: "Waste / Spoilage Log", href: "/dashboard/inventory/waste" },
      { name: "Purchase Orders", href: "/dashboard/inventory/purchase-orders" },
      { name: "Expiring Soon", href: "/dashboard/inventory/expiring-soon" },
      { name: "AI Center", href: "/dashboard/inventory/ai-center" }
    ]
  },
  {
    name: "Orders",
    icon: <OrdersIcon />,
    roles: ["admin", "staff", "kitchen"],
    items: [
      { name: "Current Orders", href: "/dashboard/orders" },
      { name: "KOT Display", href: "/dashboard/orders/kot" },
      { name: "Order History", href: "/dashboard/orders/history" },
      { name: "Order Status Management", href: "/dashboard/orders/status" },
      { name: "Billing & Checkout Logs", href: "/dashboard/orders/billing" }
    ]
  }
];

// Will add the rest of the navigation groups in the next file to avoid timeouts
