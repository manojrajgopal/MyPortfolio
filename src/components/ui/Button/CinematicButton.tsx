'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Magnetic } from '@/components/motion/Magnetic';
import { cn } from '@/lib/utils/cn';

interface BaseProps {
  readonly children: ReactNode;
  readonly variant?: 'solid' | 'quiet';
  readonly className?: string;
  readonly showArrow?: boolean;
}

type CinematicButtonProps = BaseProps &
  (
    | { readonly href: string; readonly external?: boolean; readonly onClick?: never }
    | { readonly href?: undefined; readonly external?: never; readonly onClick: () => void }
  );

/**
 * The only button style on the site: a hairline that fills with copper on
 * approach, wrapped in a magnetic field.
 */
export function CinematicButton({
  children,
  href,
  external,
  onClick,
  variant = 'solid',
  className,
  showArrow = true,
}: CinematicButtonProps): React.JSX.Element {
  const classes = cn('btn', variant === 'quiet' && 'btn--quiet', className);

  const content = (
    <>
      <span>{children}</span>
      {showArrow ? <ArrowUpRight className="btn__arrow" size={14} aria-hidden="true" /> : null}
    </>
  );

  if (href) {
    return (
      <Magnetic strength={10}>
        {external ? (
          <a className={classes} href={href} target="_blank" rel="noreferrer noopener">
            {content}
          </a>
        ) : (
          <Link prefetch={false} className={classes} href={href}>
            {content}
          </Link>
        )}
      </Magnetic>
    );
  }

  return (
    <Magnetic strength={10}>
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    </Magnetic>
  );
}
