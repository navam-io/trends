/**
 * Card Components
 * Simple card components using CVA for consistent styling
 */

import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';

const cardVariants = cva(
  'rounded-lg border bg-white shadow-sm',
  {
    variants: {
      size: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const cardHeaderVariants = cva('pb-3');
const cardContentVariants = cva('pt-0');
const cardTitleVariants = cva('text-lg font-semibold leading-tight');

interface CardProps {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className, size }: CardProps) {
  return (
    <div className={cardVariants({ size, className })}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cardHeaderVariants({ className })}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cardContentVariants({ className })}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cardTitleVariants({ className })}>
      {children}
    </h3>
  );
}