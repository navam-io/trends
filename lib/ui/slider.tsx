'use client';

import { clsx } from 'clsx';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  className 
}: SliderProps) {
  const currentValue = value[0] || 0;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onValueChange([newValue]);
  };

  return (
    <div className={clsx('relative w-full', className)}>
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div 
          className="absolute h-2 bg-indigo-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
      />
    </div>
  );
}