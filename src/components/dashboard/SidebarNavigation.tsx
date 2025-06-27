'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { navigationData } from '@/lib/navigation/sidebar-data';
import { navigationDataPart2 } from '@/lib/navigation/sidebar-data-part2';
import { navigationDataPart3 } from '@/lib/navigation/sidebar-data-part3';
import { NavGroup, NavItem } from '@/lib/navigation/sidebar-items';

interface SidebarNavigationProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

const SidebarNavigation = ({ isMobile = false, onItemClick }: SidebarNavigationProps) => {
  const { user } = useAuth();
  const pathname = usePathname();

  // Combine all navigation data
  const allNavigation = [...navigationData, ...navigationDataPart2, ...navigationDataPart3];

  // State for expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Filter navigation based on user roles
  const filteredNavigation = allNavigation.filter(group => {
    if (!user?.roles || !group.roles) return false;
    return group.roles.some(role => user.roles?.[role as keyof typeof user.roles]);
  });

  // Check if a nav item is active
  const isItemActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <>
      <div className="flex items-center flex-shrink-0 px-4">
        <h1 className="text-xl font-bold text-primary">FlashPoint QR</h1>
      </div>
      <nav className="mt-5 flex-1 px-2 space-y-2 overflow-y-auto scrollbar-hide">
        {filteredNavigation.map((group) => (
          <div key={group.name} className="pb-2">
            {/* Category Header */}
            <button 
              onClick={() => toggleCategory(group.name)}
              className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="mr-3 text-gray-500">{group.icon}</span>
                <span>{group.name}</span>
              </div>
              <svg 
                className={`h-4 w-4 text-gray-500 transition-transform ${expandedCategories[group.name] ? 'transform rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Category Items */}
            {expandedCategories[group.name] && (
              <div className="mt-1 ml-6 space-y-1">
                {group.items.map((item) => {
                  const active = isItemActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-1.5 text-sm font-medium rounded-md ${
                        active
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={onItemClick}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
      
      {/* User profile */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex-shrink-0 group block w-full">
          <div className="flex items-center">
            <div>
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {user?.email}
              </p>
              <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                {user?.roles?.admin ? 'Admin' : user?.roles?.staff ? 'Staff' : 'Kitchen'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarNavigation;
