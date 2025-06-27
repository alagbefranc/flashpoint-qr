'use client';

import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  position?: 'right' | 'left';
  showClose?: boolean;
  overlay?: boolean;
}

export function SlidePanel({
  isOpen,
  onClose,
  title,
  children,
  width = 'md',
  position = 'right',
  showClose = true,
  overlay = true,
}: SlidePanelProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Width classes mapping
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    'full': 'max-w-full'
  };

  // Position classes mapping
  const positionClasses = {
    right: 'right-0 translate-x-full',
    left: 'left-0 -translate-x-full'
  };

  // Position transform classes when open
  const positionOpenClasses = {
    right: 'translate-x-0',
    left: 'translate-x-0'
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      {overlay && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide panel */}
      <div
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col bg-background shadow-lg transition-all duration-300 ease-in-out w-full',
          widthClasses[width],
          positionClasses[position],
          isOpen && positionOpenClasses[position]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slide-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 
            className="text-lg font-semibold" 
            id="slide-panel-title"
          >
            {title}
          </h2>
          {showClose && (
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-muted transition-colors"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  );
}
