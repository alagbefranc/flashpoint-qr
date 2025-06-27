// Navigation data structure for sidebar menu items
import { ReactNode } from 'react';

// Define user roles type for sidebar
export type UserRole = 'owner' | 'admin' | 'manager' | 'staff' | 'kitchen';

export interface SubNavItem {
  name: string;
  href: string;
  roles?: UserRole[];
}

export interface NavItem {
  name: string;
  href: string;
  icon?: ReactNode;
  roles?: UserRole[];
  subItems?: SubNavItem[];
}

export interface NavGroup {
  name: string;
  icon?: ReactNode;
  items: NavItem[];
  roles?: UserRole[];
}


// The navigation items will be populated in the SidebarNavigation component
// This file just defines the types
