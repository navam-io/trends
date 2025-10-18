import React from 'react';
import { clientConfig } from '@/lib/config/client';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className = '', children }: SkeletonProps) {
  const animationClass = clientConfig.ui.loading.skeleton.animation === 'pulse' 
    ? 'animate-pulse' 
    : 'animate-shimmer';
    
  return (
    <div className={`bg-gray-200 rounded ${animationClass} ${className}`}>
      {children}
    </div>
  );
}

export function TrendCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-6 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

export function TrendRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="px-6 py-4">
        <Skeleton className="h-5 w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-4 w-3/4 max-w-sm" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-8 w-16" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </td>
    </tr>
  );
}

export function NeedCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  );
}

export function SolutionCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-5 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
        <div className="text-center">
          <Skeleton className="h-3 w-16 mb-1 mx-auto" />
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-3 w-16 mb-1 mx-auto" />
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-3 w-16 mb-1 mx-auto" />
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
      </div>
    </div>
  );
}

interface ProgressLoaderProps {
  message?: string;
  showAfter?: number;
}

export function ProgressLoader({ 
  message = 'Loading...', 
  showAfter = clientConfig.ui.loading.progress.show_after 
}: ProgressLoaderProps) {
  const [visible, setVisible] = React.useState(false);
  const [messageIndex, setMessageIndex] = React.useState(0);
  const messages = clientConfig.ui.loading.progress.messages;
  
  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), showAfter);
    return () => clearTimeout(timer);
  }, [showAfter]);
  
  React.useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [visible, messages.length]);
  
  if (!visible) return null;
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200"></div>
        <div className="absolute top-0 h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-sm text-gray-600 animate-pulse">
        {messages[messageIndex] || message}
      </p>
    </div>
  );
}