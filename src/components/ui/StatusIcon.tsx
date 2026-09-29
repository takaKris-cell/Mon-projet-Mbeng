import React from 'react';
import { Check, AlertTriangle, XCircle, Info } from 'lucide-react';

interface StatusIconProps {
  type: 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ type, size = 'lg', className = '' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18 sm:w-20 sm:h-20'
  };

  const iconSizes = {
    sm: 18,
    md: 26,
    lg: 34
  };

  switch (type) {
    case 'success':
      return (
        <div className={`flex items-center justify-center rounded-full bg-[#DDF0E6] text-[#2F9E6E] ${sizeClasses[size]} ${className}`}>
          <Check size={iconSizes[size]} strokeWidth={2.8} />
        </div>
      );
    case 'warning':
      return (
        <div className={`flex items-center justify-center rounded-full bg-[#FBF0DC] text-[#A8710A] border border-[#F0D9A8] ${sizeClasses[size]} ${className}`}>
          <AlertTriangle size={iconSizes[size]} strokeWidth={2.4} />
        </div>
      );
    case 'error':
      return (
        <div className={`flex items-center justify-center rounded-full bg-[#FBE9E7] text-[#B3261E] border border-[#F0BDB8] ${sizeClasses[size]} ${className}`}>
          <XCircle size={iconSizes[size]} strokeWidth={2.4} />
        </div>
      );
    case 'info':
      return (
        <div className={`flex items-center justify-center rounded-full bg-[#FBEDE6] text-[#C0512F] ${sizeClasses[size]} ${className}`}>
          <Info size={iconSizes[size]} strokeWidth={2.4} />
        </div>
      );
  }
};
