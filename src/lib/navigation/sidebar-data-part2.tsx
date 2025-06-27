'use client';

import { NavGroup } from './sidebar-items';
import React from 'react';

// Icons for the categories
const TableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const StaffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ReviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

export const navigationDataPart2: NavGroup[] = [
  {
    name: "Table Management",
    icon: <TableIcon />,
    roles: ["admin", "staff"],
    items: [
      { name: "Table Layout Editor", href: "/dashboard/tables" },
      { name: "Zones / Areas", href: "/dashboard/tables/zones" },
      { name: "Live Table Status", href: "/dashboard/tables/status" },
      { name: "Assign Waiters", href: "/dashboard/tables/waiters" }
    ]
  },
  {
    name: "Reservations",
    icon: <CalendarIcon />,
    roles: ["admin", "staff"],
    items: [
      { name: "View Bookings", href: "/dashboard/reservations" },
      { name: "Add Reservation", href: "/dashboard/reservations/add" },
      { name: "Schedule & Time Slots", href: "/dashboard/reservations/schedule" },
      { name: "Reservation History", href: "/dashboard/reservations/history" }
    ]
  },
  {
    name: "Staff Management",
    icon: <StaffIcon />,
    roles: ["admin"],
    items: [
      { name: "Staff List", href: "/dashboard/staff" },
      { name: "Assign Roles & Permissions", href: "/dashboard/staff/roles" },
      { name: "Shift Scheduling", href: "/dashboard/staff/schedule" },
      { name: "Activity Logs", href: "/dashboard/staff/activity" },
      { name: "Staff Performance (AI)", href: "/dashboard/staff/performance" }
    ]
  },
  {
    name: "AI Insights",
    icon: <ChartIcon />,
    roles: ["admin"],
    items: [
      { name: "Sales Forecast", href: "/dashboard/insights/sales" },
      { name: "Menu Optimization", href: "/dashboard/insights/menu" },
      { name: "Inventory Trends", href: "/dashboard/insights/inventory" },
      { name: "Staff Efficiency", href: "/dashboard/insights/staff" },
      { name: "Customer Behavior", href: "/dashboard/insights/customers" },
      { name: "Review Sentiment Analysis", href: "/dashboard/insights/reviews" }
    ]
  },
  {
    name: "Reviews & Feedback",
    icon: <ReviewIcon />,
    roles: ["admin", "staff"],
    items: [
      { name: "View Reviews", href: "/dashboard/reviews" },
      { name: "Respond to Feedback", href: "/dashboard/reviews/respond" },
      { name: "AI Summary of Sentiment", href: "/dashboard/reviews/sentiment" },
      { name: "Flags (Negative / Urgent)", href: "/dashboard/reviews/flags" }
    ]
  }
];

// Will add the final navigation groups in the next file to avoid timeouts
