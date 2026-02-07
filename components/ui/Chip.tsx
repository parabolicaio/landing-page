'use client';
import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'a' | 'button';
};

export default function Chip({ children, className = '', as = 'span' }: Props) {
  const Tag = as as any;
  return (
    <Tag
      className={`inline-flex items-center gap-2 px-3 py-1 text-sm bg-parabolica-50 text-parabolica rounded-pill ${className}`}
    >
      {children}
    </Tag>
  );
}

