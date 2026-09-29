import React from 'react';
import { PaymentProvider } from '../../types';

interface PaymentMethodIconProps {
  type: PaymentProvider;
  className?: string;
}

export const PaymentMethodIcon: React.FC<PaymentMethodIconProps> = ({ type, className = 'w-9 h-9' }) => {
  switch (type) {
    case 'orange':
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#FF7900] text-white p-1.5 shadow-sm ${className}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="4" fill="#FF7900" stroke="none" />
            <path d="M7 17L17 7M17 7H9M17 7V15" stroke="white" strokeWidth="2.5" />
          </svg>
        </div>
      );
    case 'mtn':
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#FFCC00] text-[#241F18] font-bold p-1 border border-[#E4DCCB] ${className}`}>
          <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
            <rect width="32" height="32" rx="6" fill="#FFCC00" />
            <circle cx="16" cy="16" r="10" stroke="#04263B" strokeWidth="2" />
            <circle cx="16" cy="16" r="3.5" fill="#E4032E" />
            <path d="M12 16h8" stroke="#04263B" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'paypal':
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#F5F7FA] border border-[#003087]/20 p-1 ${className}`}>
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
            <path d="M7 20.5L9.5 4.5H16C18.5 4.5 19.5 5.8 19 8C18.4 10.5 16.8 12.2 14.5 12.2H11.2L9.8 20.5H7Z" fill="#003087" />
            <path d="M9.5 16.5L11 7H16C17.7 7 18.6 8 18.2 9.8C17.7 12 16.3 13.5 14.3 13.5H11.5L10.3 20.5H8.2L9.5 16.5Z" fill="#009CDE" opacity="0.9" />
          </svg>
        </div>
      );
    case 'card':
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#241F18] text-white p-1.5 ${className}`}>
          <svg viewBox="0 0 32 20" className="w-full h-full" fill="none">
            <rect width="32" height="20" rx="3" fill="#241F18" />
            <circle cx="12" cy="10" r="6" fill="#EB001B" />
            <circle cx="20" cy="10" r="6" fill="#F79E1B" fillOpacity="0.85" />
          </svg>
        </div>
      );
  }
};
