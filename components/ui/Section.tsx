import React from 'react';

type Props = React.PropsWithChildren<{
  id?: string;
  className?: string;
}>;

export default function Section({ children, id, className = '' }: Props) {
  return (
    <section id={id} className={`py-8 md:py-12 ${className}`}>
      {children}
    </section>
  );
}

