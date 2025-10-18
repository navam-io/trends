/**
 * Badge Component
 * Small status indicators and labels
 */

import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        destructive: 'bg-red-100 text-red-800 hover:bg-red-200',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
        success: 'bg-green-100 text-green-800 hover:bg-green-200',
        warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  className?: string;
  children: ReactNode;
}

export function Badge({ variant, className, children }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, className })}>
      {children}
    </div>
  );
}