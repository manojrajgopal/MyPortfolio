import { cn } from '@/lib/utils/cn';

interface TokenListProps {
  readonly items: readonly string[];
  readonly className?: string;
  /** Rendered uppercase by default; pass false for proper nouns. */
  readonly upper?: boolean;
}

/**
 * Technologies as typography separated by hairlines — never as pills.
 * This is the primary way the site states what something was built with.
 */
export function TokenList({ items, className, upper = true }: TokenListProps): React.JSX.Element {
  return (
    <ul className={cn('tokens', className)}>
      {items.map((item) => (
        <li key={item} className="type-token" style={upper ? undefined : { textTransform: 'none' }}>
          {item}
        </li>
      ))}
    </ul>
  );
}
