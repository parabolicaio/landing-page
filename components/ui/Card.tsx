'use client';
import React from 'react';

type Props = React.PropsWithChildren<{
  className?: string;
}>;

export default function Card({ children, className = '' }: Props) {
  return (
    <div className={`bg-white border border-gray-100 shadow-sm rounded-surface p-6 ${className}`}>
      {children}
    </div>
  );
}

