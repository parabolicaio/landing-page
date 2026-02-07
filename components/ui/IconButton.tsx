'use client';
import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export default function IconButton({ className = '', label, ...rest }: Props) {
  return (
    <button
      aria-label={label}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-parabolica-100 ${className}`}
      {...rest}
    />
  );
}

