import Link from 'next/link';
import React from 'react';

interface BrandPillProps {
  text: string;
  href?: string;
  className?: string;
}

export default function BrandPill({ text, href = '/', className = '' }: BrandPillProps) {
  const content = (
    <div
      className={[
        'inline-flex items-center',
        'px-4 py-1.5',
        'bg-white/30 dark:bg-gray-900/40 backdrop-blur-xl',
        'border border-gray-200/40 dark:border-gray-700/40',
        'rounded-full shadow-md',
        'transition-colors',
        className,
      ].join(' ')}
    >
      <span className='bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent font-semibold tracking-wide'>
        {text}
      </span>
    </div>
  );

  return href ? (
    <Link href={href} className='hover:opacity-90 transition-opacity'>
      {content}
    </Link>
  ) : (
    content
  );
}