'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import LoaderOne from '@/components/ui/loader-one';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    type = 'button',
    ...props 
  }, ref) => {
    const variants = {
      primary: 'bg-primary hover:bg-primary-dark text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
      outline: 'bg-transparent hover:bg-gray-50 text-primary border border-primary',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
    };
    
    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded',
      md: 'text-sm px-4 py-2 rounded-md',
      lg: 'text-base px-6 py-3 rounded-md',
    };

    return (
      <button
        type={type}
        className={cn(
          'relative inline-flex justify-center items-center font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
          variants[variant],
          sizes[size],
          (isLoading || disabled) && 'opacity-70 cursor-not-allowed',
          className
        )}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <LoaderOne />
          </span>
        )}
        <span className={cn('flex items-center', isLoading && 'invisible')}>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
