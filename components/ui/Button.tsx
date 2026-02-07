'use client';
import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none';
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-pill',
    md: 'px-4 py-2 text-base rounded-surface',
    lg: 'px-6 py-3 text-lg rounded-surface',
  };

  const variants: Record<string, string> = {
    primary:
      'bg-parabolica text-white hover:bg-parabolica-700 active:scale-98 focus:ring-4 focus:ring-parabolica-200',
    secondary:
      'bg-transparent border border-parabolica text-parabolica hover:bg-parabolica-50 focus:ring-4 focus:ring-parabolica-50',
    ghost: 'bg-transparent text-parabolica hover:underline',
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

