import React from 'react';

type Props = React.PropsWithChildren<{
  className?: string;
  as?: 'div' | 'section' | 'main';
}>;

export default function Container({ children, className = '', as = 'div' }: Props) {
  const Tag = as as any;
  return (
    <Tag className={`container mx-auto px-6 max-w-8xl ${className}`}>{children}</Tag>
  );
}

