import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils/cn';

interface SectionLabelProps {
  readonly index: string;
  readonly children: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/** Chapter marker: index, a rule that draws itself, then the name. */
export function SectionLabel({
  index,
  children,
  className,
  style,
}: SectionLabelProps): React.JSX.Element {
  return (
    <p className={cn('label', className)} style={style}>
      <span className="type-index tabular">{index}</span>
      <span className="label__rule" aria-hidden="true" />
      <span className="type-meta type-meta--wide">{children}</span>
    </p>
  );
}
