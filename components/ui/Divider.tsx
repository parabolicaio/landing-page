'use client';
import React from 'react';

type Props = {
  className?: string;
  vertical?: boolean;
};

export default function Divider({ className = '', vertical = false }: Props) {
  if (vertical) {
    return <div className={`w-px bg-gray-100 ${className}`} />;
  }
  return <hr className={`border-t border-gray-100 ${className}`} />;
}

