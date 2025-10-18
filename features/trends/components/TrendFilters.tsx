'use client';

import { TrendCategory } from '../types/trend';
import { clsx } from 'clsx';

interface TrendFiltersProps {
  selectedCategory: TrendCategory | null;
  onCategoryChange: (category: TrendCategory | null) => void;
}

const categories: { value: TrendCategory | null; label: string; color: string }[] = [
  { value: null, label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { value: 'consumer', label: 'Consumer', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { value: 'competition', label: 'Competition', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { value: 'economy', label: 'Economy', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { value: 'regulation', label: 'Regulation', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
];

export function TrendFilters({ selectedCategory, onCategoryChange }: TrendFiltersProps) {
  return (
    <div className="flex flex-nowrap gap-2">
      {categories.map((category) => (
        <button
          key={category.label}
          onClick={() => onCategoryChange(category.value)}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            selectedCategory === category.value
              ? 'bg-indigo-600 text-white'
              : category.color
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}