'use client';

import { clsx } from 'clsx';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      className={clsx(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked 
          ? 'bg-indigo-600' 
          : 'bg-gray-200',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
    >
      <span
        className={clsx(
          'inline-block h-4 w-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}